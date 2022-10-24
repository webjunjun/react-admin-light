import logo from '../../assets/img/logo.svg';
import '../../assets/css/home.scss';
import { Button } from 'antd';

function App() {
  return (
    <div className="App">
      <div className="foobar">红红火火</div>
      <Button type="primary">Button</Button>
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
