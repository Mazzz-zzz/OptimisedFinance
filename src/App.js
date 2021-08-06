import './App.css';
import {ReactComponent as Logo} from './Title.svg';
import Victorygraph from './victorygraph.js';
import Abracadabra from './Abracadabra.js'
import { render } from "react-dom";
import React, {useState} from 'react';

function App() {
  const [activeSection, setActiveSection] = useState("Terra");
  return (
    <div className="App">
      <header className="App-header">
          <Logo />
          <div className="Preset-Container">
            <div active={activeSection} className="P-Elem Info" onClick={() => setActiveSection("Info")}>Info</div>
            <div active={activeSection} className="P-Elem TerraS" onClick={() => setActiveSection("Terra")}>Terra Farming</div>
            <div active={activeSection} className="P-Elem Looper" onClick={() => setActiveSection("Abracadabra")}>Abracadabra Looper</div>
            <div className="P-Elem Contracts">Contracts</div>
          </div>
      </header>
      <div className="Content-Container">
        <div className="Graph-Container">
          {(activeSection == "Terra")
            ? <Victorygraph name="MainGraph"></Victorygraph>
            : (activeSection == "Abracadabra") ? <Abracadabra></Abracadabra>
            : (activeSection == "Info") ? <h1>Info Section</h1>
            : <b>Contracts</b>
          }
          
        </div>
      </div>
    </div>
  );
}

export default App;
