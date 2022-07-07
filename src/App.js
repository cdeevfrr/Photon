import logo from './logo.svg';
import './App.css';
import GameView from './GameView';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <GameView tiles="123" entities="456"/>
      </header>
    </div>
  );
}

export default App;
