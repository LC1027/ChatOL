const User = require('../models/userModel')
const bcrypt = require('bcrypt');//文件加密（单向）
const { isValidObjectId } = require('mongoose');

//配置路由中间件

module.exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const usernameCheck = await User.findOne({ username });//检查数据库中是否存在此用户名
    if (usernameCheck)
      return res.json({ msg: "此用户名已被使用", status: false });
    const emailCheck = await User.findOne({ email });//检查数据库中是否存在此邮箱
    if (emailCheck)
      return res.json({ msg: "此邮箱已被使用", status: false });
    const hashedPassword = await bcrypt.hash(password, 10);//加盐hash
    const user = await User.create({//创建用户
      email,
      username,
      password: hashedPassword,
    });
    delete user.password;//用户密码不会返回
    return res.json({ status: true, user });
  } catch (ex) {
    next(ex);
  }
};

module.exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });//检查数据库中是否存在此用户名
    if (!user)
      return res.json({ msg: "用户名或密码错误", status: false });
    const isPasswordValid = await bcrypt.compare(password, user.password);//验证密码
    if (!isPasswordValid)
      return res.json({ msg: "用户名或密码错误", status: false });
    delete user.password;//用户密码不会返回
    return res.json({ status: true, user });
  } catch (ex) {
    next(ex);
  }
};

module.exports.setAvatar = async (req, res, next) => {
  try {
    const userId = req.params.id;//读取用户id
    const avatarImage = req.body.image;//读取头像
    const userData = await User.findByIdAndUpdate(//查找用户
      userId,
      //更新头像数据
      {
        isAvatarImageSet: true,
        avatarImage,
      },
      { new: true }
    );
    return res.json({
      isSet: userData.isAvatarImageSet,
      image: userData.avatarImage,
    });
  } catch (ex) {
    next(ex);
  }
};

module.exports.addFriend = async (req, res, next) => {
  try {
    const friendId = req.body.id//读取好友Id
    const userId = req.params.id;//获取当前用户id
    if(!isValidObjectId(friendId))return res.json({ msg: "Wrong userId" })
    const friendData = await User.find({ _id: friendId }).select([
      "email",
      "username",
      "avatarImage",
      "_id",
    ]);
    const userFriendData = await User.find({ _id: userId }).select('friends');//获取用户的好友信息
    userFriendData[0].friends.push(friendId)
    const friendFriendData = await User.find({ _id: friendId }).select('friends');//获取好友的好友信息
    friendFriendData[0].friends.push(userId)
    await User.findByIdAndUpdate(//查找用户
      userId,
      //更新用户的好友数据
      { friends: userFriendData[0].friends }
    );
    await User.findByIdAndUpdate(//查找好友
      friendId,
      //更新好友的好友数据
      { friends: friendFriendData[0].friends }
    );
    return res.json(friendData);
  } catch (ex) {
    next(ex);
  }
};

module.exports.getAllUsers = async (req, res, next) => {
  try {
    const userId = req.params.id
    const friends = await User.find({ _id: userId }).select('friends');//获取用户的好友信息
    const users = await User.find({ _id: { $in: friends[0].friends } }).select([
      "email",
      "username",
      "avatarImage",
      "_id",
    ]);
    return res.json(users);
  } catch (ex) {
    next(ex);
  }
};

module.exports.logOut = (req, res, next) => {
  try {
    if (!req.params.id) return res.json({ msg: "User id is required " });
    return res.status(200).send();
  } catch (ex) {
    next(ex);
  }
};
