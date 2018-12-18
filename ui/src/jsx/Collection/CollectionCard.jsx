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
	ModalFooter,
	ModalHeader
} from "reactstrap";
import AddCredential from "./AddCredential";
import CryptoJS from "crypto-js";
import Alert from "../Alert/Alert";
import moment from "moment";

class CollectionCard extends React.Component {
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
			viewPassword: false,
			lastUpdate: moment().unix(),
			sharedWith: [],
			showSharedWith: false,
			addClicked: false,
			addedUsers: [],
			deletedUsers: []
		}
	}
	
	componentWillReceiveProps(nextProps) {
		this.setState({
			name: nextProps.name,
			userData: nextProps.userData
		})
	}
	
	removeAlert() {
		this.setState({
			isAlert: false,
			alertMessage: "",
			alertType: "danger"
		})
	}
	
	getDataFromAPI() {
		fetch('/collection/' + this.state.name, {
			headers: {
				'Content-Type': 'application/json',
				'user': this.state.userData.email
			},
		})
			.then(response => response.json())
			.then(function (json) {
				this.setState({
					keys: json.keys,
					lastUpdate: moment().unix()
				});
			}.bind(this));
	}
	
	togglePasswordModal() {
		this.setState({
			passwordShow: !this.state.passwordShow,
			lastUpdate: moment().unix()
		});
	}
	
	toggleCredsModal() {
		this.setState({
			credsShow: !this.state.credsShow,
			lastUpdate: moment().unix()
		});
	}
	
	getCreds(e) {
		let password = e.target.value;
		if (e.keyCode === 13) {
			fetch('/collection/' + this.state.name + '/credential/e886689e-b810-4f07-a522-c8d6e15818b0', {
				headers: {
					'Content-Type': 'application/json',
					'user': this.state.userData.email
				},
			})
				.then(response => response.json())
				.then(function (json) {
					let decrypted = CryptoJS.AES.decrypt(json.password, password);
					if (decrypted.toString(CryptoJS.enc.Utf8) === "testPass") {
						this.setState({
							creds: json,
							passwordShow: false,
							password: password,
							locked: false,
							lastUpdate: moment().unix(),
							sharedWith: json.shared
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
							alertType: "danger",
							lastUpdate: moment().unix()
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
						alertType: "danger",
						lastUpdate: moment().unix()
					});
				}.bind(this));
			this.timeOutStart()
		}
	}
	
	timeOutStart() {
		setTimeout(function () {
			if (moment().unix() - this.state.lastUpdate > 100) {
				this.setState({
					password: "",
					locked: true,
					creds: {},
					credsShow: false,
					keys: []
				})
			} else {
				this.timeOutStart();
			}
		}.bind(this), 100);
	}
	
	addCred(data) {
		if (this.state.password !== "") {
			let encrypted = CryptoJS.AES.encrypt(data.credential, this.state.password);
			fetch("/collection", {
				method: "post",
				headers: {
					'Content-Type': 'application/json',
					'user': this.state.userData.email
				},
				body: JSON.stringify({
					secret_name: data.name,
					collection: this.state.name,
					password: encrypted.toString(),
					shared: data.shared
				})
			}).then(response => response.json())
				.catch(function (error) {
					console.log(error);
					return error
				});
			this.getDataFromAPI();
			
		} else {
			this.setState({
				isAlert: true,
				alertMessage: "Password expired!",
				alertType: "danger"
			})
		}
		this.newCredentialToggle();
	}
	
	credHTTPCall(credKey) {
		fetch('/collection/' + this.state.name + '/credential/' + credKey, {
			headers: {
				'Content-Type': 'application/json',
				'user': this.state.userData.email
			},
		})
			.then(response => response.json())
			.then(function (json) {
				let decrypted = CryptoJS.AES.decrypt(json.password, this.state.password);
				json.password = decrypted.toString(CryptoJS.enc.Utf8);
				this.setState({
					creds: json,
					credsShow: true,
					lastUpdate: moment().unix()
				})
			}.bind(this))
			.catch(function (error) {
				this.setState({
					creds: {},
					credsShow: false,
					locked: true,
					lastUpdate: moment().unix()
				});
			}.bind(this))
	}
	
	fetchCreds(e) {
		let credKey = e.target.id;
		if (this.state.locked) {
			this.setState({
				passwordShow: true,
				password: "",
				passwordKey: credKey,
				lastUpdate: moment().unix()
			});
		} else {
			this.credHTTPCall(credKey);
		}
	}
	
	viewPasswordToggle() {
		this.setState({
			viewPassword: !this.state.viewPassword,
			lastUpdate: moment().unix()
		})
	}
	
	newCredentialToggle() {
		this.setState({
			addNewCred: !this.state.addNewCred,
			lastUpdate: moment().unix()
		})
	}
	
	toggleSharedWith() {
		this.setState({
			showSharedWith: !this.state.showSharedWith,
			lastUpdate: moment().unix()
		})
	}
	
	onClickAddSharing() {
		this.setState({
			addClicked: !this.state.addClicked
		})
	}
	
	keyDownNewUser(e) {
		if (e.keyCode === 13) {
			let user = e.target.value;
			if (!CollectionCard.validateEmail(user)) {
				this.setState({
					isAlert: true,
					alertMessage: "Please enter a correct email address",
					alertType: "danger",
				});
			} else {
				let addedUsers = this.state.addedUsers;
				let sharedWith = this.state.sharedWith;
				if (sharedWith.indexOf(user) === -1 && addedUsers.indexOf(user) === -1) {
					addedUsers.push(user);
					this.setState({
						addedUsers: addedUsers,
						addClicked: false
					})
				} else {
					this.setState({
						isAlert: true,
						alertMessage: "User already added",
						alertType: "danger",
					});
				}
			}
			
		}
	}
	
	removeUser(user) {
		let addedUsers = this.state.addedUsers;
		let deletedUsers = this.state.deletedUsers;
		let sharedWith = this.state.sharedWith;
		let addedIndex = addedUsers.indexOf(user);
		if (addedIndex !== -1) {
			addedUsers = addedUsers.splice(addedIndex, 1);
		} else {
			let sharedIndex = sharedWith.indexOf(user);
			if (sharedIndex !== -1) {
				sharedWith.splice(sharedIndex, 1);
				deletedUsers.push(user);
			}
		}
		this.setState({
			addedUsers: addedUsers,
			sharedWith: sharedWith,
			deletedUsers: deletedUsers
		});
	}
	
	onAddCheckPress() {
		let user = document.getElementById("addNewUser").value;
		if (!CollectionCard.validateEmail(user)) {
			this.setState({
				isAlert: true,
				alertMessage: "Please enter a correct email address",
				alertType: "danger",
			});
		} else {
			let addedUsers = this.state.addedUsers;
			let sharedWith = this.state.sharedWith;
			if (sharedWith.indexOf(user) === -1 && addedUsers.indexOf(user) === -1) {
				addedUsers.push(user);
				this.setState({
					addedUsers: addedUsers,
					addClicked: false
				})
			} else {
				this.setState({
					isAlert: true,
					alertMessage: "User already added",
					alertType: "danger",
				});
			}
		}
	}
	
	static validateEmail(email) {
		let re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(email);
	}
	
	render() {
		const {name, keys, creds, addNewCred, locked, password, viewPassword, sharedWith, addClicked, addedUsers, deletedUsers} = this.state;
		
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
						sharedWith.length !== 0 && !locked ?
							<Button outline color={"success"} className="btn-pill" size="sm"
							        onClick={this.toggleSharedWith.bind(this)}>
								<i className="fa fa-share" style={{marginRight: "5px"}}/>Share
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
								<Input type="text" defaultValue={creds.secretID} disabled/>
							</Col>
						</FormGroup>
						<FormGroup row>
							<Col md="2">
								<Label>Credential</Label>
							</Col>
							<Col md="10">
								<InputGroup>
									<Input type={viewPassword ? "text" : "password"} defaultValue={creds.password}/>
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
				<Modal isOpen={this.state.showSharedWith} toggle={this.toggleSharedWith.bind(this)}
				       className={'modal-danger'}>
					<ModalHeader>Shared With</ModalHeader>
					<ModalBody style={{textAlign: "center"}}>
						{
							sharedWith.map(function (item) {
								return (
									<div key={item}>
										<Button outline color="info" style={{width: "80%", marginTop: "10px"}} id={item}
										        className="btn-square">
											{item}
										</Button>
										<Button color="info" style={{width: "10%", marginTop: "10px"}} className="btn-square"
										        onClick={this.removeUser.bind(this, item)}>
											<span className="fa fa-times"/>
										</Button>
									</div>
								)
							}.bind(this))
						}
						{
							addedUsers.map(function (item) {
								return (
									<div key={item}>
										<Button outline color="success" style={{width: "80%", marginTop: "10px"}} id={item}
										        className="btn-square">
											{item}
										</Button>
										<Button color="success" style={{width: "10%", marginTop: "10px"}} className="btn-square"
										        onClick={this.removeUser.bind(this, item)}>
											<span className="fa fa-times"/>
										</Button>
									</div>
								)
							}.bind(this))
						}
						{
							deletedUsers.map(function (item) {
								return (
									<div key={item}>
										<Button outline color="danger" className="btn-square"
										        style={{width: "80%", marginTop: "10px", textDecoration: "line-through"}} id={item}>
											{item}
										</Button>
										<Button color="danger" style={{width: "10%", marginTop: "10px"}} className="btn-square">
											<span className="fa fa-refresh"/>
										</Button>
									</div>
								)
							})
						}
					</ModalBody>
					<ModalFooter style={{justifyContent: "center"}}>
						{
							addClicked ?
								<InputGroup style={{width: "90%"}}>
									<Input type="text" id="addNewUser" valid onKeyDown={this.keyDownNewUser.bind(this)}/>
									<InputGroupAddon addonType="append" onClick={this.onAddCheckPress.bind(this)}>
										<Button color="success" outline>
											<i className="fa fa-check"/>
										</Button>
									</InputGroupAddon>
								</InputGroup> :
								<Button outline color="success" onClick={this.onClickAddSharing.bind(this)}>Add</Button>
						}
					</ModalFooter>
				</Modal>
				<AddCredential collectionName={name} addNewCred={addNewCred}
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

export default CollectionCard;