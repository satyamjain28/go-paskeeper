/**
 * Created by Satyam on 23/10/18.
 */


import React from 'react';
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	Col,
	FormGroup,
	Input,
	InputGroup,
	InputGroupAddon,
	InputGroupText,
	Label,
	Modal,
	ModalBody,
	ModalHeader
} from "reactstrap";
import AddCredential from "./AddCredential";
import CryptoJS from "crypto-js";
import Alert from "../Alert/Alert";

class BucketCard extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			name: props.name,
			userData: props.userData,
			keys: [],
			creds: {},
			passwordShow: false,
			passwordKey: "",
			addNewCred: false,
			locked: true,
			password: "",
			isAlert: false,
			alertMessage: "",
			alertType: "danger",
			viewPassword: false
		}
	}
	
	componentWillReceiveProps(nextProps) {
		this.setState({
			name: nextProps.name,
			userData: nextProps.userData
		})
	}
	
	// componentWillMount() {
	// 	this.getDataFromAPI();
	// }
	
	removeAlert() {
		this.setState({
			isAlert: false,
			alertMessage: "",
			alertType: "danger"
		})
	}
	
	getDataFromAPI() {
		fetch('/password/' + this.state.name)
			.then(response => response.json())
			.then(function (json) {
				this.setState({
					keys: json.keys
				});
			}.bind(this));
	}
	
	togglePasswordModal() {
		this.setState({
			passwordShow: !this.state.passwordShow
		});
	}
	
	toggleCredsModal() {
		this.setState({
			credsShow: !this.state.credsShow
		});
	}
	
	getCreds(e) {
		let password = e.target.value;
		if (e.keyCode === 13) {
			fetch('/password/' + this.state.name + '/e886689e-b810-4f07-a522-c8d6e15818b0')
				.then(response => response.json())
				.then(function (json) {
					let decrypted = CryptoJS.AES.decrypt(json.password, password);
					if (decrypted.toString(CryptoJS.enc.Utf8) === "testPass") {
						this.setState({
							creds: json,
							passwordShow: false,
							password: password,
							locked: false
						});
						if (this.state.passwordKey !== "") {
							this.credHTTPCall(this.state.passwordKey);
						}
						this.getDataFromAPI();
					} else {
						this.setState({
							creds: {},
							passwordShow: false,
							password: "",
							locked: true,
							isAlert: true,
							alertMessage: "Incorrect Password!",
							alertType: "danger"
						})
					}
				}.bind(this))
				.catch(function (error) {
					this.setState({
						creds: {},
						passwordShow: false,
						password: "",
						locked: true,
						isAlert: true,
						alertMessage: "Incorrect Password!",
						alertType: "danger"
					});
				}.bind(this));
			this.timeOutStart()
		}
	}
	
	timeOutStart() {
		setTimeout(function () {
			this.setState({
				password: "",
				locked: true,
				creds: {},
				credsShow: false,
				keys: []
			})
		}.bind(this), 10000);
	}
	
	addCred(data) {
		let encrypted = CryptoJS.AES.encrypt(data.credential, this.state.password);
		fetch("/password", {
			method: "post",
			headers: {
				'Content-Type': 'application/json',
				'user': this.state.userData.email
			},
			body: JSON.stringify({
				secret_name: data.name,
				bucket: this.state.name,
				password: encrypted.toString()
			})
		}).then(response => response.json())
			.catch(function (error) {
				console.log(error);
				return error
			});
		this.getDataFromAPI();
		this.newCredentialToggle();
	}
	
	credHTTPCall(credKey) {
		fetch('/password/' + this.state.name + '/' + credKey)
			.then(response => response.json())
			.then(function (json) {
				let decrypted = CryptoJS.AES.decrypt(json.password, this.state.password);
				json.password = decrypted.toString(CryptoJS.enc.Utf8);
				this.setState({
					creds: json,
					credsShow: true
				})
			}.bind(this))
			.catch(function (error) {
				this.setState({
					creds: {},
					credsShow: false,
					locked: true
				});
			}.bind(this))
	}
	
	fetchCreds(e) {
		let credKey = e.target.id;
		if (this.state.locked) {
			this.setState({
				passwordShow: true,
				password: "",
				passwordKey: credKey
			});
		} else {
			this.credHTTPCall(credKey);
		}
	}
	
	viewPasswordToggle() {
		this.setState({
			viewPassword: !this.state.viewPassword
		})
	}
	
	newCredentialToggle() {
		this.setState({
			addNewCred: !this.state.addNewCred
		})
	}
	
	render() {
		const {name, keys, creds, addNewCred, locked, password, viewPassword} = this.state;
		
		return (
			<Card outline className={locked ? "card-accent-danger" : "card-accent-success"}>
				<CardHeader>
					<b>{name}</b>
					{
						locked ?
							<span className="float-right"><i className="fa fa-lock text-danger"/></span> :
							<span className="float-right"><i className="fa fa-unlock text-success"/></span>
					}
				
				</CardHeader>
				<CardBody style={{height: locked ? "80px" : "200px", overflow: "scroll"}}>
					{
						password === "" ? false :
							<Button outline color={"success"} className="btn-pill" size="sm"
							        onClick={this.newCredentialToggle.bind(this)} style={{marginRight: "5px"}}>
								<i className="fa fa-plus" style={{marginRight: "5px"}}/>Creds
							</Button>
						
					}
					{
						locked ?
							<Button outline color={"success"} className="btn-pill" size="sm"
							        onClick={this.togglePasswordModal.bind(this)}>
								<i className="fa fa-unlock" style={{marginRight: "5px"}}/>Unlock
							</Button> : false
					}
					{
						keys.map(function (item, idx) {
							if (item !== "e886689e-b810-4f07-a522-c8d6e15818b0") {
								return (
									<Button key={idx} outline color={locked ? "info" : "info"}
									        style={{width: "80%", marginTop: "10px"}} id={item}
									        onClick={this.fetchCreds.bind(this)}>
										{item}
									</Button>
								)
							}
						}.bind(this))
					}
				</CardBody>
				<Modal isOpen={this.state.passwordShow} toggle={this.togglePasswordModal.bind(this)}
				       className={'modal-danger'}>
					<ModalHeader>Enter Password</ModalHeader>
					<ModalBody>
						<Input type="password" onKeyDown={this.getCreds.bind(this)}/>
					</ModalBody>
				</Modal>
				<Modal isOpen={this.state.credsShow} toggle={this.toggleCredsModal.bind(this)}
				       className={'modal-danger'}>
					<ModalHeader>Credentials</ModalHeader>
					<ModalBody>
						<FormGroup row>
							<Col md="2">
								<Label>Name</Label>
							</Col>
							<Col md="10">
								<Input type="text" value={creds.secretID} disabled/>
							</Col>
						</FormGroup>
						<FormGroup row>
							<Col md="2">
								<Label>Credential</Label>
							</Col>
							<Col md="10">
								<InputGroup>
									<Input type={viewPassword ? "text" : "password"} value={creds.password}/>
									<InputGroupAddon addonType="append" onClick={this.viewPasswordToggle.bind(this)}>
										<InputGroupText>
											<i className="fa fa-eye"/>
										</InputGroupText>
									</InputGroupAddon>
								</InputGroup>
							</Col>
						</FormGroup>
					</ModalBody>
				</Modal>
				<AddCredential bucketName={name} addNewCred={addNewCred}
				               addCred={this.addCred.bind(this)}
				               newCredentialToggle={this.newCredentialToggle.bind(this)}/>
				{this.state.isAlert ?
					<Alert message={this.state.alertMessage}
					       removeAlert={this.removeAlert.bind(this)}
					       type={this.state.alertType}/> : false
				}
			</Card>
		)
	}
}

export default BucketCard;