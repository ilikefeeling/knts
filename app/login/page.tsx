"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleKakaoLogin = async () => {
    setIsLoading(true)
    const supabase = createClient()
    
    // Auth URL parameters to configure Kakao OAuth
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'profile_nickname profile_image',
      },
    })

    if (error) {
      console.error("Login error:", error.message)
      alert("로그인 중 오류가 발생했습니다. 다시 시도해주세요.")
      setIsLoading(false)
    }
  }

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '32px', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>현장관리 시스템</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>안전하고 체계적인 데이터 관리를 위해<br/>로그인이 필요합니다.</p>
      </div>

      <button 
        onClick={handleKakaoLogin} 
        disabled={isLoading}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          width: '100%',
          maxWidth: '320px',
          backgroundColor: '#FEE500',
          color: '#000000',
          border: 'none',
          borderRadius: '12px',
          padding: '16px 24px',
          fontSize: '18px',
          fontWeight: '700',
          cursor: isLoading ? 'wait' : 'pointer',
          transition: 'transform 0.1s',
          opacity: isLoading ? 0.7 : 1,
        }}
      >
        {/* 간단한 카카오톡 로고 아이콘 (SVG) */}
        <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 3C6.477 3 2 6.551 2 10.933c0 2.805 1.83 5.253 4.606 6.643-.223.83-1.025 3.738-1.054 3.906-.037.214.161.222.302.128.11-.073 3.488-2.316 4.887-3.23 1.054.178 2.146.275 3.259.275 5.523 0 10-3.55 10-7.932C24 6.551 19.523 3 12 3z" fill="#000000"/>
        </svg>
        {isLoading ? "연결 중..." : "카카오로 시작하기"}
      </button>
    </div>
  )
}
