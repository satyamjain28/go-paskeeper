/**
 * Created by Satyam on 19/10/18.
 */


import React from 'react';
import {Button, Input} from "reactstrap";
import CryptoJS from "crypto-js";

class SecretApp extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			privateKey: "myntra@123",
			encrypted: "",
			decrypted: ""
		}
	}
	
	encrypt() {
		let value = document.getElementById("encrypt").value;
		let encrypted = CryptoJS.AES.encrypt(value, this.state.privateKey);
		console.log(encrypted.toString());
		this.setState({
			encrypted: encrypted.toString()
		});
	}
	
	decrypt() {
		let decrypted = CryptoJS.AES.decrypt(this.state.encrypted, this.state.privateKey);
		console.log(decrypted.toString(CryptoJS.enc.Utf8));
		this.setState({
			decrypted: decrypted.toString(CryptoJS.enc.Utf8)
		});
	}
	
	render() {
		return (
			<div style={{textAlign: "center"}}>
				<Input id="encrypt" className="col-sm-4 offset-4" style={{marginTop: "10px", marginBottom: "10px"}}/>
				<Button onClick={this.encrypt.bind(this)}>Encrypt</Button>
				<br/>
				{/*<p style={{fontSize: "10px", marginTop: "10px", width: "100px"}}>{this.state.encrypted}</p>*/}
				<br/>
				<Input id="decrypt" className="col-sm-4 offset-4" style={{marginBottom: "10px"}}/>
				<Button onClick={this.decrypt.bind(this)}>Decrypt</Button>
				<br/>
				{/*<div style={{fontSize: "10px", marginTop: "10px"}}>{this.state.decrypted}</div>*/}
			</div>
		)
	}
}

export default SecretApp;