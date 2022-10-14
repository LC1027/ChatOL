import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import styled from "styled-components";
import { allUsersRoute, host } from "../utils/APIRoutes";
import ChatContainer from "../components/ChatContainer";
import Contacts from "../components/Contacts";
import Welcome from "../components/Welcome";
import background from "../assets/back-ground.jpg";

export default function Chat() {
  const navigate = useNavigate()
  const socket = useRef()
  //联系人
  const [contacts, setContacts] = useState([])
  //当前聊天对象
  const [currentChat, setCurrentChat] = useState(undefined)
  //当前用户
  const [currentUser, setCurrentUser] = useState(undefined)

  useEffect(() => {
    async function fn() {
      //为登录返回登录页面
      if (!localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)) {
        navigate('/login')
      } else {
        //读取当前用户信息
        setCurrentUser(
          await JSON.parse(
            localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
          )
        )
      }
    }
    fn()
  }, [])
  useEffect(() => {
    async function fn1() {
      if (currentUser) {
        socket.current = io(host)//连接服务器
        socket.current.emit('add-user', currentUser._id)//触发添加用户事件
        if (currentUser.isAvatarImageSet) {
          //获取好友信息
          const data = await axios.get(`${allUsersRoute}/${currentUser._id}`)
          setContacts(data.data)
        } else {
          navigate('/setavatar')
        }
      }
    }
    fn1()
  }, [currentUser])

  const handleChatChange = (chat) => {
    //更新聊天内容
    setCurrentChat(chat)
  }

  return (
    <>
      <Container>
        <div className="container">
          {currentUser&&<Contacts contacts={contacts} changeChat={handleChatChange} socket={socket} />}
          {
            currentChat === undefined ?
              (<Welcome />) :
              //ref传入子组件
              (<ChatContainer currentChat={currentChat} socket={socket} />)
          }
        </div>
      </Container>
    </>
  )
}

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  align-items: center;
  background-image:url(${background});
  background-size:cover;
  .container {
    height: 85vh;
    width: 85vw;
    background-color: #00000070;
    display: grid;
    grid-template-columns: 25% 75%;
    @media screen and (min-width: 720px) and (max-width: 1080px) {
      grid-template-columns: 35% 65%;
    }
  }
`;