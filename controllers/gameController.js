let controller = require('./controller');
const Room= require('../models/room');
const User= require('../models/user');

class GameController extends controller{
    async situation(req, res, next){
        try {
            let room= await Room.findOne({_id :req.query.id});
            if(room){
                let error= true;
                for (let i = 0; i < room.users.length ; i++) {
                    if(room.users[i].id === req.user.id){
                        error= false;
                        break;
                    }
                }
                if (error) this.error('مجاز به دریافت اطلاعات این اتاق نیستید', 403);
                let aliveUsers= [];
                let needUpdate= false;
                let nightDeads= [];
                if(room.nightDeads){
                    nightDeads= [...room.nightDeads];
                }
                for (let i = 0; i < room.users.length; i++) {
                    if(!room.users[i].shot || room.users[i].doc) {
                        if (room.users[i].alive) {
                            aliveUsers.push(this.showUser(room.users[i], false));
                        }
                    }else{
                        if(room.users[i].alive){
                            room.users[i].alive= false;
                            if(room.users[i].role === 'maf' || room.users[i].role === 'god'){
                                room.badAlive= room.badAlive-1
                            }else{
                                room.goodAlive= room.goodAlive-1
                            }
                            nightDeads.push(this.showUser(room.users[i], false));
                            needUpdate= true;
                        }
                    }
                }
                if(needUpdate){
                    await Room.updateOne({_id: req.query.id}, {$set: {users: room.users, dayVotes: [], goodAlive: room.goodAlive, badAlive: room.badAlive, nightDeads: nightDeads}}).then(result=>{
                        if(result.ok===1){
                            return  this.success('نتیجه شب', {aliveUsers, nightDeads}, res, 200);
                        }else{
                            return  this.error('مشکلی رخ داده‌است');
                        }
                    }).catch(e=> next(e))
                }else {
                    await Room.updateOne({_id: req.query.id}, {$set: {dayVotes: []}}).then(result => {
                        if (result.ok === 1) {
                            return this.success('نتیجه شب', {aliveUsers, nightDeads}, res, 200);
                        } else {
                            return this.error('مشکلی رخ داده‌است');
                        }
                    }).catch(e => next(e))
                }
            }else{
                this.error('اتاق مورد نظر یافت نشد', 404)
            }
        }catch (e) {
            next(e)
        }
    }

    async startNight(req, res, next){
        try {
            let room= await Room.findOne({_id: req.body.id});
            if(room){
                if(room.dayVotes) {
                    if(room.dayVotes.length === room.goodAlive+room.badAlive) {
                        for (let i = 0; i < room.users.length; i++) {
                            room.users[i].doc = false;
                            room.users[i].shot = false;
                        }
                        await Room.updateOne({_id: room.id}, {$set:{users: room.users}}).then(result=>{
                            if(result.ok===1){
                                this.success('شب آغاز میشود', null, res);
                            }else{
                                this.error('مشکلی رخ داده‌است')
                            }
                        }).catch(e=> next(e))
                    }else{
                        this.success('منتظر بمانید تا همه رای دهند', null, res);
                    }
                }else {
                    this.success('منتظر بمانید تا همه رای دهند', null, res);
                }
            }else{
                this.error('اتاق یافت نشد', 404);
            }
        }catch (e) {
            next(e)
        }
    }

    async shot(req, res, next){
        try {
            let user = await User.findOne({_id: req.user.id});
            if (user) {
                let room= await Room.findOne({_id: user.room});
                let shotUser= {};
                for (let i = 0; i < room.users.length; i++) {
                    if(req.body.userId === room.users[i].id){
                        room.users[i].shot= true;
                        shotUser= this.showUser(room.users[i], false);
                        break;
                    }
                }
                await Room.updateOne({_id: user.room}, {$set:{'users': room.users, nightDeads: null}}).then(result=>{
                    if(result.ok === 1){
                        return  this.success(`با موفقیت شلیک کردید`, {shotUser}, res);
                    }else{
                        return  this.error('شلیک موفقیت آمیز نبود')
                    }
                }).catch(e=> next(e));
            } else {
                this.error('کاربر یافت نشد', 401);
            }
        }catch (e) {
            next(e);
        }
    }

    async doc(req, res, next){
        try {
            let user = await User.findOne({_id: req.user.id});
            if (user) {
                let room = await Room.findOne({_id: user.room});
                let savedUser={};
                for (let i = 0; i < room.users.length; i++) {
                    if(req.body.userId === room.users[i].id){
                        room.users[i].doc= true;
                        savedUser= this.showUser(room.users[i], false);
                        break;
                    }
                }
                await Room.updateOne({_id: user.room}, {$set:{'users': room.users}}).then(result=>{
                    if(result.ok === 1){
                        return  this.success(`با موفقیت گزینه نجات را انتخاب کردید`, {savedUser}, res);
                    }else{
                        return  this.error('مشکلی رخ‌داده‌است')
                    }
                }).catch(e=> next(e));
            }else{
                this.error('کاربر یافت نشد', 401);
            }
        }catch (e) {
            next(e)
        }
    }
    async detective(req, res, next){
        try{
            let room= await Room.findOne({_id: req.query.room});
            if(room){
                let user= null;
                for (let i = 0; i < room.users.length ; i++) {
                    if(req.query.user === room.users[i].id){
                        user= room.users[i];
                        break;
                    }
                }
                if(user){
                    room.detectiveLogs.push(user);
                    let self= this;
                    await Room.updateOne({_id: req.query.room}, {$set: {detectiveLogs: room.detectiveLogs}}).then(result=>{
                        if(result.ok===1) {
                            if (user.role === 'maf') {
                                self.success('نتیجه استعلام شما مثبت میباشد.', {inquiry: true}, res);
                            } else if (user.role === 'god') {
                                let ans= 0;
                                for (let i = 0; i < room.detectiveLogs.length; i++) {
                                    if(user.id === room.detectiveLogs[i].id){
                                        ans ++
                                    }
                                }
                                if(ans === 2){
                                    self.success('نتیجه استعلام شما مثبت میباشد.', {inquiry: true}, res);
                                }else{
                                    self.success('نتیجه استعلام شما منفی میباشد.', {inquiry: false}, res);
                                }
                            } else {
                                self.success('نتیجه استعلام شما منفی میباشد.', {inquiry: false}, res);
                            }
                        }else{
                            self.error('مشکلی رخ‌داده‌است.');
                        }
                    }).catch(e=>{
                        next(e)
                    })
                }else{
                    this.error('کاربر مورد نظر یافت نشد', 404)
                }
            }else{
                this.error('اتاق یافت نشد', 404)
            }
        }catch (e) {
            next(e);
        }
    }
}

module.exports= new GameController();
