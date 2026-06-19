import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="error-page">
      <div className="error-page__icon">
        <i className="bi bi-compass" />
      </div>
      <h1>404</h1>
      <p>The page you're looking for doesn't exist or may have been moved.</p>
      <Link to="/" className="btn btn--primary">
        <i className="bi bi-house" /> Back to Dashboard
      </Link>
    </div>
  )
}