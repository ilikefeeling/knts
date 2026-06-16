"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function StartPage() {
  const router = useRouter()

  useEffect(() => {
    // PWA 시작 페이지로 진입하면 즉시 메인 화면으로 이동
    router.replace("/")
  }, [router])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8f9fa' }}>
      <p style={{ color: '#6c757d' }}>앱을 시작하는 중...</p>
    </div>
  )
}
