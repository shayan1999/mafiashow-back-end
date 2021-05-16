const { validationResult } = require('express-validator');
let controller = require('./controller');
const mongoose = require('mongoose');
const Room = require('../models/room');
const User= require('../models/user');

class roomController extends controller{

    async create(req, res, next){
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                let myErrors = errors.array().map((e)=> e.msg )
                this.error(myErrors, 402);
            }
            let newRoom={};
            let self= this;
            newRoom.admin = {
                userName: req.user.userName,
                id: req.user.id
            };
            let existRoom= await Room.findOne({"admin.id": req.user.id});
            if(existRoom) {
                this.error("اتاق فعال دارید", 409)
            }
            newRoom.roles = await this.shuffleRoles(req.body.roles);
            newRoom.badAlive = await this.goodBadCounter(newRoom.roles);
            newRoom.goodAlive= newRoom.roles.length - newRoom.badAlive;
            let firstUser= {
                userName: req.user.userName,
                id: req.user.id,
                shot: false,
                doc: false,
                alive: true,
                role: newRoom.roles[0]
            };
            newRoom.users= [firstUser];
            newRoom.link= await this.LinkMaker(req.body.name, req.body.userNumbers);
            newRoom.nightTime= req.body.nightTime;
            newRoom.name= req.body.name;
            newRoom.userNumbers= req.body.userNumbers;
            newRoom.nightDeads= null;
            let saveRoom= new Room(newRoom);
            await saveRoom.save().then(async result=>{
                let addRoom= await self.addRoomToMe(result._id, req.user);
                console.log(addRoom)
                if(addRoom) {
                    console.log(result)
                    let resUser = self.showUser(firstUser);
                    let resRoom = self.showRoom(result);
                    this.success('اتاق شما ساخته شد', {
                        user: {
                            resUser
                        },
                        room: {
                            resRoom
                        }
                    }, res, 201);
                }
            }).catch(e=>{
                next(e);
            })
        }catch (e) {
            next(e);
        }
    }

    async joinRoom(req, res, next){
        try {
            let findRoom = await Room.findOne({link: req.body.link});
            if (findRoom) {
                console.log(findRoom)
                for (let i = 0; i < findRoom.users.length; i++) {
                    if (findRoom.users[i].id === req.user.id){
                        let resUser= this.showUser(findRoom.users[i]);
                        let resRoom= this.showRoom(findRoom);
                        return this.success('بازگشت به اتاق', {user: resUser, room: resRoom}, res);
                    }
                }
                let newUser = {
                    userName: req.user.userName,
                    id: req.user.id,
                    shot: false,
                    doc: false,
                    alive: true,
                    role: findRoom.roles[findRoom.users.length]
                }
                let users = [...findRoom.users];
                users.push(newUser);
                let newvalues = {$set: {'users': users}};
                let self = this;
                console.log(findRoom._id)
                await Room.updateOne({_id: findRoom._id}, newvalues).then(async result=>{
                    if(result.ok === 1){
                        let addRoom= await self.addRoomToMe(findRoom._id, req.user);
                        if(addRoom) {
                            let resUser = self.showUser(newUser);
                            let resRoom = self.showRoom(findRoom);
                            return self.success(`شدید ${findRoom.name} وارد اتاق`, {user: resUser, room: resRoom}, res);
                        }
                    }else{
                        return self.error('مشکلی رخ داده‌است');
                    }
                }).catch(e=> next(e))
            } else {
                this.error('اتاق پیدا نشد', 404)
            }
        }catch (e) {
            next(e)
        }
    }

    async myRoom(req, res, next){
        try {
            let user = await User.findOne({_id: req.user.id});
            if (user) {
                if(user.room){
                    this.success('اتاق فعال', {room: user.room}, res);
                }else{
                    this.success('اتاق فعالی موجود نیست', null, res);
                }
            } else {
                this.error('کاربری موجود نیست', 401);
            }
        }catch (e) {
            next(e);
        }
    }

    shuffleRoles(roles){
        let currentIndex = roles.length, temporaryValue, randomIndex;
        // While there remain elements to shuffle...
        while (0 !== currentIndex) {
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            // And swap it with the current element.
            temporaryValue = roles[currentIndex];
            roles[currentIndex] = roles[randomIndex];
            roles[randomIndex] = temporaryValue;
        }
        return roles;
    }

    LinkMaker(name, length) {
        let result= [];
        let characters= 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let charactersLength = characters.length;
        for ( let i = 0; i < length; i++ ) {
            result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
        }
        return result.join('')+name;
    }

    async addRoomToMe(id, user){
        return await User.updateOne({_id: user.id}, {$set:{room: id}}).then(result=>{
            if(result.ok===1){
                return true
            }else return this.error('مشکلی رخ داده‌است')
        }).catch(e=> this.error(e))
    }

    goodBadCounter(roles){
        let badCounter=0;
        for (let i = 0; i < roles.length; i++) {
            if(roles[i]==='maf' || roles[i]==='god'){
                badCounter++
            }
        }
        return badCounter
    }

}


module.exports= new roomController();
