module.exports = (io, socket) => {

    const Room= require('../models/room');
    const User= require('../models/user');
    const {showRoom,showUser, error, success, checkJwt}= require('./utils')


    const getVote = async (data) => {
        try {
            let tokenCheck= await checkJwt(data.token);
            let room= await Room.findOne({_id: data.room_id});
            if(tokenCheck.success) {
                let user= tokenCheck.user;
                if (room) {
                    let dayVotes = room.dayVotes;
                    let findUser = await User.findOne({_id: data.userId});
                    if (findUser) {
                        if (dayVotes.length !== 0 && dayVotes[dayVotes.length - 1].id === findUser.id) {
                            if (data.isVote) {
                                dayVotes[dayVotes.length - 1].votes++;
                                dayVotes[dayVotes.length - 1].userVoter.push(user.userName);
                            }
                            dayVotes[dayVotes.length - 1].voters++;
                            if (dayVotes[dayVotes.length - 1].voters === room.goodAlive + room.badAlive - 1) {
                                if (dayVotes.length !== room.goodAlive + room.badAlive) {
                                    io.to(data.room_id).emit( 'finishVote', success('رای نفر بعدی را بگیرید', {finish: 1}));
                                } else {
                                    let secondVotes= [];
                                    for (let i = 0; i < dayVotes.length ; i++) {
                                        if(dayVotes[i].votes >= dayVotes[i].voters/2){
                                            secondVotes.push(dayVotes[i]);
                                        }
                                    }
                                    if(secondVotes.length>0){
                                        await Room.updateOne({_id: data.room_id}, {$set: {secondDayVote: secondVotes}}).then(result=>{
                                            io.to(data.room_id).emit('finishVote', success('so it seems that we should go for another round of votes', {mostVotes: secondVotes, finish: 3}));
                                        }).catch(e=>{
                                            io.to(data.room_id).emit('finishVote', success('so it seems that we should go for another round of votes', {mostVotes: secondVotes, finish: 3}));
                                        })
                                    }else{
                                        io.to(data.room_id).emit('finishVote', success('no one will go out today and when you are ready tell your admin to start the night', {finish: 2}));
                                    }
                                }
                            }
                        } else {
                            let newUser = showUser(findUser);
                            newUser.voters = 1;
                            newUser.votes = (data.isVote === true) ? 1 : 0;
                            newUser.userVoter = (data.isVote === true) ? [user.userName] : [];
                            dayVotes.push(newUser);
                        }
                        await Room.updateOne({_id: data.room_id}, {$set: {dayVotes: dayVotes}}).then(result => {
                            io.to(data.room_id).emit('getVote', success('there is a new vote', {dayVotes}));
                        }).catch(e => {
                            socket.emit('getVote', error(null, null, {e}));
                        })
                    } else {
                        socket.emit('getVote', error('یوزر پیدا نشد', 404));
                    }
                } else {
                    socket.emit('getVote', error('اتاق پیدا نشد', 404))
                }
            }else{
                socket.emit('getVote',tokenCheck.error);
            }
        }catch (e) {
            socket.emit('getVote', error(null, null, {e}));
        }
    }

    const secondVote= async (data)=>{
        // you should give me room id and your choice id ad token
        try {
            let myRoom= await Room.findOne({_id: data.room_id});
            let tokenCheck= await checkJwt(data.token);
            if(myRoom){
                if(tokenCheck.success) {
                    let secondDayVote = [...myRoom.secondDayVote];
                    let user= tokenCheck.user;
                    let AllSecondVotes = 0;
                    console.log(AllSecondVotes)
                    if(data.userId) {
                        for (let i = 0; i < secondDayVote.length; i++) {
                            console.log('d:::', data.userId);
                            if (secondDayVote[i].id === data.userId) {
                                secondDayVote[i].secondVoters= (secondDayVote[i].secondVoters)?secondDayVote[i].secondVoters+1:1;
                                secondDayVote[i].secondvote=(secondDayVote[i].secondvote)?secondDayVote[i].secondvote+1:1;
                                (secondDayVote[i].userSecondVoter)?secondDayVote[i].userSecondVoter.push(user.userName):secondDayVote[i].userSecondVoter= [user.userName];
                            }
                            if(secondDayVote[i].secondVoters) AllSecondVotes = AllSecondVotes + secondDayVote[i].secondVoters;
                        }
                    }else{
                        secondDayVote[0].secondVoters=(secondDayVote[0].secondVoters)?secondDayVote[0].secondVoters+1:1;
                        for (let i = 0; i < secondDayVote.length; i++) {
                            if(secondDayVote[i].secondVoters) {
                                AllSecondVotes = AllSecondVotes + secondDayVote[i].secondVoters;
                            }
                        }
                    }
                    console.log(AllSecondVotes);
                    await Room.updateOne({_id: data.room_id}, {$set:{secondDayVote: secondDayVote}}).then(result=>{
                        if(result.ok === 1){
                            console.log(AllSecondVotes, myRoom.goodAlive + myRoom.badAlive - secondDayVote.length)
                            if(AllSecondVotes === myRoom.goodAlive + myRoom.badAlive - secondDayVote.length){
                                let lost= {
                                    number: (secondDayVote[0].secondvote)?secondDayVote[0].secondvote:0,
                                    voters: (secondDayVote[0].userSecondVoter)?secondDayVote[0].userSecondVoter:0,
                                    id: secondDayVote[0].id,
                                    userName: secondDayVote[0].userName,
                                    equal: false
                                }
                                for (let i = 1; i < secondDayVote.length; i++) {
                                    if(secondDayVote[i].secondvote > lost.number){
                                        lost.equal= false;
                                        lost.number= secondDayVote[i].secondvote;
                                        lost.voters= secondDayVote[i].userSecondVoter;
                                        lost.id= secondDayVote[i].id;
                                        lost.userName= secondDayVote[i].userName;
                                    }else if(secondDayVote[i].secondvote === lost.number){
                                        lost.equal= true;
                                    }
                                }
                                if(lost.equal){
                                    io.to(data.room_id).emit('finishVote', success('nobody has enough votes when you are ready tell your admin to start the night', {finish: 4, votes: secondDayVote}));
                                }else{
                                    if(lost.number>=(myRoom.goodAlive+myRoom.badAlive-secondDayVote.length)/2){
                                        let users= [...myRoom.users];
                                        let good= myRoom.goodAlive;
                                        let bad= myRoom.badAlive;
                                        for (let i = 0; i < users.length ; i++) {
                                            if(lost.id === users[i].id){
                                                users[i].alive= false;
                                                if(users[i].role === 'god' || users[i].role === 'maf'){
                                                    bad--
                                                }else{
                                                    good--
                                                }
                                                break;
                                            }
                                        }
                                        Room.updateOne({_id: data.room_id}, {$set:{users: users, goodAlive: good, badAlive: bad}}).then(res=>{
                                            if(res.ok===1){
                                                io.to(data.room_id).emit('finishVote', success('so you decide to kick someone when you are ready tell your admin to start the night', {deadBody: lost}));
                                            }else{
                                                socket.emit('secondVote', error('رای ثبت نشد', 500));
                                            }
                                        }).catch(e=>{
                                            socket.emit('secondVote', error('رای ثبت نشد', 500));
                                        })
                                    }else{
                                        io.to(data.room_id).emit('finishVote', success('nobody has enough votes when you are ready tell your admin to start the night', {finish: 4, votes: secondDayVote}));
                                    }
                                }
                            }else{
                                io.to(data.room_id).emit('secondVote', success('یک رای ثبت شد', secondDayVote));
                            }
                        }else{
                            socket.emit('secondVote', error('رای ثبت نشد', 500));
                        }
                    }).catch(e=>{
                        socket.emit('secondVote', error('رای ثبت نشد', 500, e));
                    })

                }else{
                    socket.emit('secondVote',tokenCheck.error);
                }
            }else{
                socket.emit('secondVote', error('اتاق پیدا نشد', 404));
            }
        }catch (e) {
            socket.emit('secondVote', error(null, null, {e}));
        }
    }

    const startNight= async (data)=>{
        try {

        }catch (e) {
            socket.emit('startNight', error('---', null, e))
        }
    }

    const joinRoom = async (data)=>{
        try {
            let myRoom= await Room.findOne({_id: data.room_id});
            let tokenCheck= await checkJwt(data.token);
            if(tokenCheck.success) {
                if (myRoom) {
                    await socket.join(data.room_id);
                    socket.emit('join',
                        success(`به اتاق ${myRoom.name} متصل شدید`, {room: showRoom(myRoom), user: showUser(tokenCheck.user)})
                    )
                } else {
                    socket.emit('join',error('اتاق یافت نشد', 404))
                }
            }else{
                socket.emit('join',tokenCheck.error);
            }
        }catch (e) {
            socket.emit('join', error('---', null, e))
        }
    }

    socket.on("getVote", getVote);

    socket.on("secondVote", secondVote);

    socket.on("startNight", startNight);

    socket.on('join', joinRoom);

    socket.on('disconnect', () => {
        console.log('Disconnected');
    });
}
