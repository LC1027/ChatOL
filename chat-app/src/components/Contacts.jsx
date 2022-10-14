import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Logo from "../assets/logo.svg";
import { addFriendRoute } from "../utils/APIRoutes";
import axios from "axios";
import Logout from "./Logout";

export default function Contacts({ contacts, changeChat, socket }) {
  //当前用户信息
  const [currentUserInfo, setCurrentUserInfo] = useState({})
  //当前选中聊天对象
  const [currentSelected, setCurrentSelected] = useState(undefined)
  //搜索内容
  const [searchText, setSearchText] = useState('')
  //搜索结果，默认为全部好友
  const [searchRes, setSearchRes] = useState([])
  //待添加好友的id
  const [addFriendId, setAddFriendId] = useState('')
  //添加当前用户为好友的用户信息
  const [adder, setAdder] = useState(null)

  //设置当前用户名与头像
  useEffect(() => {
    async function fn() {
      setCurrentUserInfo(await JSON.parse(
        localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
      ))
      //设置有人添加当前用户时的列表刷新事件
      socket.current.on('someone-add-you', ( adderInfo ) => {
        setAdder(adderInfo)
      })
    }
    fn()
  }, [])

  useEffect(() => {
    if (adder) {
        contacts.push(adder)
        console.log(contacts)
        setSearchRes([...contacts])
        alert('您有新的好友！')
      }
  },[adder])

  useEffect(() => {
    if (searchText !== '') {
      setSearchRes(contacts.filter(res => res.username.indexOf(searchText) !== -1))
    } else {
      setSearchRes(contacts)
    }
  }, [searchText, contacts])

  //改变聊天对象
  const changeCurrentChat = (index, contact) => {
    setCurrentSelected(index)
    changeChat(contact)
  }

  const debounce = (fn, delay) => {
    let timer = null
    let that = this
    return (args) => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        fn.call(that, args)
      }, delay)
    }
  }
  const changeSearch = (e) => {
    debounceSet(e.target.value)
  }
  const debounceSet = debounce(setSearchText, 1000)

  const changeAdd = (e) => {
    setAddFriendId(e.target.value)
  }

  const addFriend = async () => {
    for (let i = 0; i < contacts.length; i++) {
      if (contacts[i]._id === addFriendId) {
        alert('已添加此好友')
        return
      }
    }
    const { data } = await axios.post(`${addFriendRoute}/${currentUserInfo._id}`, {
      id: addFriendId
    })
    if (data.msg) alert('错误的好友ID')
    else {
      //触发对方的列表刷新事件
      socket.current.emit('add-someone', {
        firendId: addFriendId,
        adderInfo: currentUserInfo,
      })
      contacts.push(data[0])
      setSearchRes([...contacts])
      alert('添加成功')
    }
  }

  return (
    <>
      {currentUserInfo.username && currentUserInfo.avatarImage && (
        <Container>
          <div className="brand">
            <img src={Logo} alt="logo" />
            <h3>Chat OL</h3>
          </div>
          <Logout className='logout' />
          <input className="search" type='text' placeholder="查找好友" onChange={e => changeSearch(e)} />
          <input className="friendId" type='text' placeholder="通过ID添加好友" onChange={e => changeAdd(e)} />
          <button className="add-friend" onClick={e => addFriend()}>添加</button>
          <div className="contacts">
            {
              searchRes.map((contact, index) => {
                return (
                  <div key={contact._id} className={`contact ${index === currentSelected ? "selected" : ""}`} onClick={() => changeCurrentChat(index, contact)}>
                    <div className="avatar">
                      <img src={`data:image/svg+xml;base64,${contact.avatarImage}`} alt="" />
                    </div>
                    <div className="username">
                      <h3>{contact.username}</h3>
                    </div>
                  </div>
                )
              })
            }
          </div>
          <div className="current-user">
            <div className="avatar">
              <img src={`data:image/svg+xml;base64,${currentUserInfo.avatarImage}`} alt="avatar" />
            </div>
            <div className="username">
              <h2>{currentUserInfo.username}</h2>
              <h2>{`ID:${currentUserInfo._id}`}</h2>
            </div>
          </div>
        </Container>
      )}
    </>
  )
}

const Container = styled.div`
  display: grid;
  grid-template-rows: 10% 5% 5% 65% 15%;
  grid-template-columns: 80% 20%;
  grid-template-areas: 'brand logout'
                       'search search'
                       'friendId add-friend'
                       'contacts contacts'
                       'current-user current-user';
  overflow: hidden;
  background-color: #08042070;
  .logout{
    grid-area:logout;
  }
  .search {
    grid-area: search;
    height:1.5rem;
    padding:1rem;
    background-color:skyblue;
    border:0.1rem solid #00a0a0;
    bord-radius:0.4rem;
    color:white;
    font-size:1rem;
    &:focus{
        border:0.1rem solid #997af0;
        outline:none;
    }
    ::placeholder {
        color: rgba(1,1,1,.5);
    }
  }
  .friendId {
    grid-area: friendId;
    height:1.5rem;
    background-color:skyblue;
    padding:1rem;
    border:0.1rem solid #00a0a0;
    bord-radius:0.4rem;
    color:white;
    font-size:1rem;
    &:focus{
        border:0.1rem solid #997af0;
        outline:none;
    }
    ::placeholder {
        color: rgba(1,1,1,.5);
    }
  }
  .add-friend{
    grid-area: add-friend;
    background-color:#ff9090;
    color:white;
    border:none;
    font-weight:bold;
    cursor:pointer;
    border-radius:0.4rem;
    font-size:1rem;
    &:hover{
        background-color:#ffb0b0;
        transform:scale(1.01);
    }
  }
  .brand {
    grid-area: brand;
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: center;
    img {
      height: 2rem;
    }
    h3 {
      color: white;
      text-transform: uppercase;
    }
  }
  .contacts {
    grid-area: contacts;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: auto;
    gap: 0.8rem;
    &::-webkit-scrollbar {
      width: 0.2rem;
      &-thumb {
        background-color: #ffffff39;
        width: 0.1rem;
        border-radius: 1rem;
      }
    }
    .contact {
      background-color: #ffffff34;
      min-height: 5rem;
      cursor: pointer;
      width: 90%;
      border-radius: 0.2rem;
      padding: 0.4rem;
      display: flex;
      gap: 1rem;
      align-items: center;
      transition: 0.5s ease-in-out;
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
    .selected {
      background-color: #9a86f3;
    }
  }

  .current-user {
    grid-area: current-user;
    background-color: #0d0d3090;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2rem;
    .avatar {
      img {
        height: 4rem;
        max-inline-size: 100%;
      }
    }
    .username {
      h2 {
        color: white;
      }
    }
    @media screen and (min-width: 720px) and (max-width: 1080px) {
      gap: 0.5rem;
      .username {
        h2 {
          font-size: 1rem;
        }
      }
    }
  }
`;