import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  // 세션에 저장된 로그인 정보 가져오기
  const username = sessionStorage.getItem("username");
  const token = sessionStorage.getItem("jwt");

  // 클릭 시 회원정보 수정 페이지 이동
  const handleUserClick = () => {
    if (!token) {
      navigate("/login"); // 로그인 페이지
    } else {
      navigate("/profile/edit"); // 회원정보 수정 페이지로 이동
    }
  };

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 20px",
        backgroundColor: "#111",
        color: "#fff",
      }}
    >
      <h1
        style={{ cursor: "pointer" }}
        onClick={() => navigate("/")}
      >
        NUZIP
      </h1>

      <nav>
        {token ? (
          // ✅ 로그인 상태: 사용자 이름 표시
          <span
            style={{
              cursor: "pointer",
              fontWeight: "600",
              background: "#fff",
              color: "#111",
              padding: "6px 10px",
              borderRadius: "6px",
            }}
            onClick={handleUserClick}
          >
            {username} 님
          </span>
        ) : (
          // 비로그인 상태: 로그인 버튼
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "6px 12px",
              background: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            로그인
          </button>
        )}
      </nav>
    </header>
  );
}
