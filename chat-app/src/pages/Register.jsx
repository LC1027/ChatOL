import React, { useEffect, useState } from 'react'
import axios from 'axios'
import style from 'styled-components'
import { useNavigate, Link } from 'react-router-dom'
import Logo from '../assets/logo.svg'
import { ToastContainer, toast } from 'react-toastify'
import "react-toastify/dist/ReactToastify.css"
import { registerRoute } from "../utils/APIRoutes"
import background from '../assets/899394.png'

export default function Register() {
    const navigate = useNavigate()
    //设置提示样式
    const toastOptions = {
        position: 'bottom-right',
        autoClose: 8000,
        pauseOnHover: true,
        draggable: true,
        theme:'dark'
    }
    //注册信息
    const [values, setValues] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword:''
    })
    useEffect(() => {
        //有用户登录信息，则转到聊天页面
        if (localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)) {
            navigate('/')
        }
    }, [])

    const handleChange = e => {
        //更新注册信息
        setValues({...values,[e.target.name]:e.target.value})
    }

    //验证输入
    const handleValidation = () => {
        const { password, confirmPassword, username, email } = values
        if (password !== confirmPassword) {
            toast.error("请确认两次输入的密码一致", toastOptions)
            return false
        }
        else if (username.length < 3) {
            toast.error("用户名需大于等于3个字符", toastOptions)
            return false
        }
        else if (password.length < 8) {
            toast.error("密码需大于等于8个字符", toastOptions)
            return false
        }
        else if (email === '') {
            toast.error("请输入邮箱", toastOptions)
            return false
        }
        return true
    }
    const handleSubmit = async (e) => {
        //阻止事件的默认提交行为，避免页面刷新回到'/'
        e.preventDefault()
        
        if (handleValidation()) {
            console.log(registerRoute)
            const { email, username, password } = values
            //post注册信息
            const { data } = await axios.post(registerRoute, {
                username,
                email,
                password
            })
            if (data.status === false) {//注册失败
                toast.error(data.msg,toastOptions)
            }
            if (data.status === true) {//注册成功
                localStorage.setItem(
                    process.env.REACT_APP_LOCALHOST_KEY,
                    JSON.stringify(data.user)
                )
                navigate('/')
            }
        }
    }

    return (
        <>
            <FormContainer>
                <form action='' onSubmit={e => handleSubmit(e)}>
                    <div className="brand">
                        <img src={Logo} alt="logo" />
                        <h1>Chat OL</h1>
                    </div>
                    <input type="text" placeholder='用户名/usernaem' name='username' onChange={e=>handleChange(e)}/>
                    <input type="email" placeholder='邮箱/email' name='email' onChange={e=>handleChange(e)}/>
                    <input type="password" placeholder='密码/password' name='password' onChange={e=>handleChange(e)}/>
                    <input type="password" placeholder='确认密码' name='confirmPassword' onChange={e => handleChange(e)} />
                    <button type='submit'>创建用户/Create User</button>
                    <span>
                        已拥有账号？<Link to='/login'>登录</Link>
                    </span>
                </form> 
            </FormContainer>
            <ToastContainer/>
        </>
    )
}

const FormContainer = style.div`
    height:100vh;
    width:100vw;
    display:flex;
    flex-direction:column;
    justify-content:center;
    gap:1rem;
    align-items:center;
    background-image:url(${background});
    background-size:cover;
    .brand{
        display:flex;
        align-items:center;
        gap:1rem;
        justify-content:center;
        img{
            height:5rem;
        }
        h1{
            color:white;
            text-transform:uppercase;
        }
    }

    form{
        width:30vw;
        display:flex;
        flex-direction:column;
        gap:2rem;
        background-color:#20202080;
        border-radius:2rem;
        padding: 3rem 5rem;
    }

    input{
        background-color:transparent;
        padding:1rem;
        border:0.1rem solid #00a0a0;
        bord-radius:0.4rem;
        color:white;
        width:100%;
        font-size:1rem;
        &:focus{
            border:0.1rem solid #997af0;
            outline:none;
        }
        ::placeholder {
            color: rgba(1,1,1,.5);
        }
    }

    button{
        background-color:#ff9090;
        color:white;
        padding:1rem 2rem;
        border:none;
        font-weight:bold;
        cursor:pointer;
        border-radius:0.4rem;
        font-size:1rem;
        text-transform:uppercase;
        &:hover{
            background-color:#ffb0b0;
            transform:scale(1.01);
        }
    }

    span{
        color:white;
        text-transform:uppercase;
        a{
            color:#00e080;
            text-decoration:none;
            font-weight:bold;
        }
    }
`
