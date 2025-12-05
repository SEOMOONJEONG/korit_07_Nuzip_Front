import { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import NuzipLogo from '../pages/Nuzip_logo2.png';
import './components.css';

type SearchBarProps = {
  keyword: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
  logoHref?: string;
};

export default function SearchBar({
  keyword,
  onChange,
  onSearch,
  placeholder = '검색어를 입력하세요',
  logoHref = '/',
}: SearchBarProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch();
  };

  return (
    <div className="search-container">
      <div className="search-shell">
        <Link to={logoHref} className="search-logo-link" aria-label="누집 홈">
          <img src={NuzipLogo} alt="Nuzip 로고" className="search-logo" />
        </Link>
        <form onSubmit={handleSubmit} className="search-form">
          <input
            type="text"
            value={keyword}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className="search-input"
          />
          <button type="submit" className="search-button">
            검색
          </button>
        </form>
      </div>
    </div>
  );
}

