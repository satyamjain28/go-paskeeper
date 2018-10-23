import React, {Component} from 'react';
import './css/App.css';
import './css/coreui-fonts.css';
import './css/coreui-styles.css';
import SecretApp from "./jsx/SecretApp";
import Header from "./jsx/Header/Header";

class App extends Component {
	render() {
		return (
			<div className="App" style={{fontFamily: "'Exo 2', sans-serif", fontSize: "10px"}}>
				<Header/>
				<SecretApp/>
			</div>
		);
	}
}

export default App;
