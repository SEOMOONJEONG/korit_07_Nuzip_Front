// 로그인 메인화면
import PropTypes from "prop-types";

export default function LoginHome({ me }) {
  return (
    <div style={{ padding: 40 }}>
      <h2>메인 페이지</h2>
      <p>로그인에 성공했습니다! 👋</p>
      {(me?.username || me?.userId) && (
        <p style={{ marginTop: 12, fontSize: 18, fontWeight: 600 }}>
          {(me?.username || me?.userId)} 님 반갑습니다.
        </p>
      )}
    </div>
  );
}

LoginHome.propTypes = {
  me: PropTypes.shape({
    userId: PropTypes.string,
  }),
};