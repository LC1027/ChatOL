import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import ChatInput from "./ChatInput";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { sendMessageRoute, recieveMessageRoute, updateNewRecieveRoute } from "../utils/APIRoutes";

const reqAccess_tokenUrl = '/api1/oauth/2.0/token?grant_type=client_credentials&client_id=smR2Gj6mApm1V0EdSZP0fn49&client_secret=bMiABX5Vy0GiOoR62fjvTfAYMY0H8mkS'
const nlpUrl = '/api1/rpc/2.0/nlp/v1/sentiment_classify?access_token='

export default function ChatContainer({ currentChat, socket }) {
  const [messages, setMessages] = useState([])//聊天框内信息
  const scrollRef = useRef()
  const [arrivalMessage, setArrivalMessage] = useState(null)//接收的信息
  const [shouldUpdate, setShouldUpdate] = useState(false)//是否刷新
  const [fromId, setFromId] = useState(undefined)//接收到的消息的发送方id
  const [access_token, setAccess_token] = useState('')//调用情感分析API所需的token

  useEffect(() => {
    //获取互相发送的信息
    async function fn() {
      const data = await JSON.parse(
        localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
      )
      const response = await axios.post(recieveMessageRoute, {
        from: data._id,
        to: currentChat._id
      })
      //更新聊天内容
      setMessages(response.data)
      if (socket.current) {
        socket.current.emit('update-msg', {
          senderId: currentChat._id,
        })
      }
    }
    fn()
  }, [currentChat])

  useEffect(() => {
    //设置接收事件
    async function fn() {
      if (socket.current) {
        socket.current.on('msg-receive', async ({ msg, from, sentiment }) => {
          //判断消息来源是否是当前聊天对象
          setFromId(from)
          setArrivalMessage({ fromSelf: false, message: msg, isRead: false, sentiment })//接收消息
        })
        //设置更新已读状态的事件
        socket.current.on('update-send', () => {
          setShouldUpdate(true)
        })
        const tokenData = await axios.get(reqAccess_tokenUrl)
        setAccess_token(tokenData.data.access_token)
      }
    }
    fn()
  }, [])
  useEffect(() => {
    async function fn() {
      const data = await JSON.parse(
        localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
      )
      //接收对方发送信息，更新聊天内容
      if (arrivalMessage && fromId === currentChat._id) {
        setMessages((prev) => [...prev, arrivalMessage])
        //触发更新发送方已读状态的事件
        socket.current.emit('update-msg', {
          senderId: fromId,
        })
        //更新数据库中信息状态
        await axios.post(updateNewRecieveRoute, {
          from: fromId,
          to: data._id,
        })
      }
    }
    fn()
  }, [arrivalMessage, fromId])
  //更新信息已读
  useEffect(() => {
    if (shouldUpdate) {
      updateMsgs()
      setShouldUpdate(false)
    }
  }, [shouldUpdate])
  //更新滚轮状态
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const updateMsgs = () => {
    const curMsgs = [...messages]
    for (let i = 0; i < curMsgs.length; i++) {
      curMsgs[i].isRead = true
    }
    setMessages(curMsgs)
  }

  const handleSendMsg = async (msg) => {
    const data = await JSON.parse(
      localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
    )
    // 对消息进行情感分析,0为消极，2为积极
    const sentimentData = await axios.post(nlpUrl + access_token, { 'text': msg }, {
      headers: { 'Content-Type': 'application/json' }
    })
    const sentiment = sentimentData.data.items?sentimentData.data.items[0].sentiment:2
    // 更新聊天内容
    const msgs = [...messages]
    msgs.push({ fromSelf: true, message: msg, isRead: false, sentiment })
    setMessages(msgs)
    //触发发送信息事件
    socket.current.emit('send-msg', {
      to: currentChat._id,
      from: data._id,
      msg,
      sentiment
    })
    //post信息
    await axios.post(sendMessageRoute, {
      from: data._id,
      to: currentChat._id,
      message: msg,
      sentiment
    })
  }

  return (
    <Container>
      <div className="chat-header">
        <div className="user-details">
          <div className="avatar">
            <img src={`data:image/svg+xml;base64,${currentChat.avatarImage}`} alt="" />
          </div>
          <div className="username">
            <h3>{currentChat.username}</h3>
          </div>
        </div>
      </div>
      <div className="chat-messages">
        {messages.map((msg) => {
          return (
            <div ref={scrollRef} key={uuidv4()}>
              <div className={`message ${msg.fromSelf ? 'sended' : 'received'}`}>
                <div className="content">
                  <p className={`${msg.sentiment > '0'?'positive':'negative'}`}>{msg.message}</p>
                  <p className="isRead">{msg.fromSelf ? `${msg.isRead ? '(已读)' : '(未读)'}` : ''}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <ChatInput handleSendMsg={handleSendMsg} />
    </Container>
  )
}

const Container = styled.div`
  display: grid;
  grid-template-rows: 10% 80% 10%;
  gap: 0.1rem;
  overflow: hidden;
  @media screen and (min-width: 720px) and (max-width: 1080px) {
    grid-template-rows: 15% 70% 15%;
  }
  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;
    .user-details {
      display: flex;
      align-items: center;
      gap: 1rem;
      .avatar {
        img {
          height: 3rem;
        }
      }
      .username {
        h3 {
          color: white;
        }
      }
    }
  }
  .chat-messages {
    padding: 1rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow: auto;
    &::-webkit-scrollbar {
      width: 0.2rem;
      &-thumb {
        background-color: #ffffff39;
        width: 0.1rem;
        border-radius: 1rem;
      }
    }
    .message {
      display: flex;
      align-items: center;
      .content {
        max-width: 40%;
        overflow-wrap: break-word;
        padding: 1rem;
        font-size: 1.1rem;
        border-radius: 1rem;
        color: #d1d1d1;
        @media screen and (min-width: 720px) and (max-width: 1080px) {
          max-width: 70%;
        }
        .positive{
          color:yellow;
        }
        .negative{
          color:skyblue;
        }
      }
    }
    .sended {
      justify-content: flex-end;
      .content {
        background-color: #0055ff50;
        .isRead{
          font-size:0.5rem;
          color:#00ff00;
        }
      }
    }
    .received {
      justify-content: flex-start;
      .content {
        background-color: #9900ff50;
      }
    }
  }
`;