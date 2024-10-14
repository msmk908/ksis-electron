import React, { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";

function ProtectedRoute() {
    const accessToken = localStorage.getItem('accessToken');

    useEffect(() => {
        if (!accessToken) {
            alert("올바르지 않은 접근입니다.");
        }
    }, [accessToken]);

    if (!accessToken) {
        return <Navigate to="/login" />;
    }

    return <Outlet />; // 보호된 경로의 자식 요소들을 렌더링
}

export default ProtectedRoute;
