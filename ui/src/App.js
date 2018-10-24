import React, {Component} from 'react';
import './css/App.css';
import './css/coreui-fonts.css';
import './css/coreui-styles.css';
import FullApp from "./jsx/FullApp";

class App extends Component {
	render() {
		return (
			<div className="App" style={{fontFamily: "'Exo 2', sans-serif", fontSize: "12px"}}>
				<FullApp/>
			</div>
		);
	}
}

export default App;
