import React from 'react'
import { Routes, BrowserRouter, Route } from "react-router-dom"
import Login from '../Screens/Login'
import Register from "../Screens/Register"
import Home from '../Screens/Home'
import Project from '../Screens/Project'
import AuthUser from '../auth/AuthUser'

const AppRoutes = () => {
  return (
    <BrowserRouter>
    <Routes>
        <Route path='/' element={<AuthUser><Home /></AuthUser>}></Route>
        <Route path='/login' element={<Login />}></Route>
        <Route path='/register' element={<Register />}></Route>
        <Route path='/project' element={<AuthUser><Project /></AuthUser>}></Route>
    </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes