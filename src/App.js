import './App.css';
import {ReactComponent as Logo} from './Title.svg';
import Victorygraph from './victorygraph.js';
import { render } from "react-dom";

function App() {
  return (
    <div className="App">
      <header className="App-header">
          <Logo />
          <div className="Preset-Container">
          <div className="P-Elem TerraS">Terra Farming</div>
          <div className="P-Elem Looper">Abracadabra Looper</div>
          <div className="P-Elem Contracts">Contracts</div>
        </div>
      </header>
      <div className="Content-Container">
        <div className="Graph-Container">
          <Victorygraph name="MainGraph"></Victorygraph>
        </div>
      </div>
    </div>
  );
}

export default App;
