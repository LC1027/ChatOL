import React, { useEffect, useState } from 'react'

export default function SearchBox(contacts) {
    const [searchText, setSearchText] = useState('')
    const [searchRes,setSearchRes] = useState([])
    const [isShow, setIsShow] = useState(false)

    useEffect(() => {
        setSearchRes=contacts.filter(res=>{res.username.indexOf(searchText)!==-1})
    },[searchText])

    const changeSearch = (e) => {
        
    }


    return (
        <>
            <input type='text' placeholder="查找联系人" onChange={(e) => setSearchText(e.target.value)} value={searchText}/>
        </>
    )
}
