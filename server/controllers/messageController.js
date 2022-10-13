const Messages = require("../models/messageModel");

module.exports.getMessages = async (req, res, next) => {
  try {
    const { from, to } = req.body;
    //获取联系人间的信息
    const messages = await Messages.find({
      users: {
        $all: [from, to],
      },
    }).sort({ createAt: 1 });

    const projectedMessages = messages.map((msg) => {
      return {
        fromSelf: msg.sender.toString() === from,//判断是否是自己发送
        message: msg.message.text,
        isRead: msg.isRead,
        sentiment:msg.sentiment,
      };
    });
    //更新信息被读情况
    await Messages.updateMany({
      users: [to, from],
    }, {
      $set: { isRead: true }
    })
    res.json(projectedMessages);
  } catch (ex) {
    next(ex);
  }
};

module.exports.addMessage = async (req, res, next) => {
  try {
    const { from, to, message, sentiment } = req.body;
    //添加用户发送的信息
    const data = await Messages.create({
      message: { text: message },
      users: [from, to],
      sender: from,
      isRead: false,
      sentiment
    });

    if (data) return res.json({ msg: "Message added successfully." });
    else return res.json({ msg: "Failed to add message to the database" });
  } catch (ex) {
    next(ex);
  }
};

module.exports.updateMessage = async (req, res, next) => {
  try {
    const { from, to } = req.body;
    //更新信息是否已读
    const data=await Messages.updateMany({
      users: [from, to],
    }, {
      $set: { isRead: true }
    })

    if (data) return res.json({ msg: "Message updated successfully." });
    else return res.json({ msg: "Failed to updated message to the database" });
  } catch (ex) {
    next(ex);
  }
};
