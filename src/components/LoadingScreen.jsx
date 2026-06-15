import '../styles/loading.css';

export default function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div className="loading-screen">
      <div className="loading-spinner" aria-hidden="true" />
      <p className="loading-message">{message}</p>
    </div>
  );
}
