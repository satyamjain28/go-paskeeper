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
import ReactJson from 'react-json-view';
import Clipboard from 'clipboard-js';
import Loader from 'react-loader-spinner';

const red = "#f86c6b";
const green = "#4dbd74";

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
			deletedUsers: [],
			owner: "",
			credsShow: false,
			imageBinary: "",
			isLoader: false
		}
	}
	
	copy(text) {
		Clipboard.copy(text);
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
				if (json.owner === this.state.userData.email) {
					if (json.shared === null || json.shared === undefined) {
						this.setState({
							keys: json.keys,
							lastUpdate: moment().unix(),
							sharedWith: [],
							owner: json.owner
						});
					} else {
						this.setState({
							keys: json.keys,
							lastUpdate: moment().unix(),
							sharedWith: json.shared,
							owner: json.owner
						});
					}
				} else {
					this.setState({
						keys: json.keys,
						lastUpdate: moment().unix(),
						sharedWith: [],
						owner: json.owner
					});
				}
			}.bind(this));
	}
	
	togglePasswordModal() {
		if (!this.state.locked) {
			this.setState({
				password: "",
				locked: true,
				creds: {},
				credsShow: false,
				keys: []
			})
		} else {
			this.setState({
				passwordShow: !this.state.passwordShow,
				lastUpdate: moment().unix()
			}, function () {
				let ele = document.getElementById("inputpassword");
				ele.focus();
			});
		}
		
	}
	
	toggleCredsModal() {
		this.setState({
			credsShow: !this.state.credsShow,
			lastUpdate: moment().unix()
		});
	}
	
	getCredsHTTP(password) {
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
	
	getCreds(e) {
		let password = e.target.value;
		if (e.keyCode === 13) {
			this.getCredsHTTP(password);
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
		console.log("Add cred called in collection card");
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
					shared: data.shared,
					type: data.type
				})
			}).then(response => response.json())
				.then(function (response) {
					this.getDataFromAPI();
					this.newCredentialToggle();
				}.bind(this))
				.catch(function (error) {
					console.log(error);
					return error
				});
		} else {
			this.setState({
				isAlert: true,
				alertMessage: "Password expired!",
				alertType: "danger"
			})
		}
	}
	
	openImage(data) {
		let src = "data:image/png;base64," + data;
		let img = "<img style=\"max-height: 800px;max-width:800px\" src=\"" + src + "\"/>";
		let newWindow = window.open(src);
		newWindow.document.write(img);
	}
	
	getCollectionDetails() {
		fetch('/collection/' + this.state.name, {
			headers: {
				'Content-Type': 'application/json',
				'user': this.state.userData.email
			},
		})
			.then(response => response.json())
			.then(function (json) {
				if (json.owner === this.state.userData.email) {
					if (json.shared === null || json.shared === undefined) {
						this.setState({
							passwordShow: false,
							locked: false,
							lastUpdate: moment().unix(),
							sharedWith: [],
							deletedUsers: [],
							addedUsers: [],
							owner: json.owner
						});
					} else {
						this.setState({
							passwordShow: false,
							locked: false,
							lastUpdate: moment().unix(),
							sharedWith: json.shared,
							deletedUsers: [],
							addedUsers: [],
							owner: json.owner
						});
					}
					
				} else {
					this.setState({
						passwordShow: false,
						locked: false,
						lastUpdate: moment().unix(),
						sharedWith: [],
						deletedUsers: [],
						addedUsers: [],
						owner: json.owner
					});
				}
			}.bind(this))
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
					lastUpdate: moment().unix(),
					isLoader: false
				})
			}.bind(this))
			.catch(function (error) {
				this.setState({
					creds: {},
					credsShow: false,
					locked: true,
					lastUpdate: moment().unix(),
					isLoader: false
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
			this.setState({
				isLoader: true
			}, this.credHTTPCall(credKey));
			
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
			addedUsers.splice(addedIndex, 1);
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
	
	restoreUser(user) {
		let sharedWith = this.state.sharedWith;
		let deletedUsers = this.state.deletedUsers;
		deletedUsers.splice(deletedUsers.indexOf(user), 1);
		sharedWith.push(user);
		this.setState({
			sharedWith: sharedWith
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
	
	updateSharedWith() {
		let data = {
			"added": this.state.addedUsers,
			"deleted": this.state.deletedUsers
		};
		fetch("/collection/" + this.state.name + "/user", {
			method: "post",
			headers: {
				'Content-Type': 'application/json',
				'user': this.state.userData.email
			},
			body: JSON.stringify(data)
		}).then(function (response) {
			this.getCollectionDetails();
		}.bind(this))
			.catch(function (error) {
				console.log(error);
				return error
			});
	}
	
	static validateEmail(email) {
		let re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(email);
	}
	
	render() {
		const {
			name, keys, creds, addNewCred, locked, password, viewPassword, passwordShow, credsShow,
			sharedWith, addClicked, addedUsers, deletedUsers, owner, userData, isAlert,
			alertMessage, alertType, showSharedWith, isLoader
		} = this.state;
		return (
			<Card outline className={locked ? "card-accent-danger" : "card-accent-success"}>
				<CardHeader>
					<b>{name}</b>
					{
						locked ?
							<span className="float-right" onClick={this.togglePasswordModal.bind(this)}><i
								className="fa fa-lock text-danger"/></span> :
							<span className="float-right" onClick={this.togglePasswordModal.bind(this)}><i
								className="fa fa-unlock text-success"/></span>
					}
				
				</CardHeader>
				{
					isLoader ?
						<Loader
							type="ThreeDots"
							color={locked ? red : green}
							height="70"
							width="70"
						/> :
						<CardBody style={{maxHeight: locked ? "80px" : "400px", overflow: "scroll"}}>
							{
								password === "" ? false : owner === userData.email ?
									<Button outline color={"success"} className="btn-pill" size="sm"
									        onClick={this.newCredentialToggle.bind(this)} style={{marginRight: "5px"}}>
										<i className="fa fa-plus" style={{marginRight: "5px"}}/>Creds
									</Button> : false
								
							}
							{
								locked ?
									<Button outline color={"success"} className="btn-pill" size="sm"
									        onClick={this.togglePasswordModal.bind(this)}>
										<i className="fa fa-unlock" style={{marginRight: "5px"}}/>Unlock
									</Button> : false
							}
							{
								!locked && userData.email === owner ?
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
				}
				
				
				<Modal isOpen={passwordShow} toggle={this.togglePasswordModal.bind(this)}
				       className={'modal-danger'}>
					<ModalHeader>Enter Password</ModalHeader>
					<ModalBody>
						<Input type="password" id={"inputpassword"} onKeyDown={this.getCreds.bind(this)}/>
					</ModalBody>
				</Modal>
				
				<Modal isOpen={credsShow} toggle={this.toggleCredsModal.bind(this)} size={"lg"}
				       className={'modal-danger'}>
					<ModalHeader>Credentials</ModalHeader>
					<ModalBody>
						<FormGroup row>
							<Col md="2">
								<Label>Name</Label>
							</Col>
							<Col md="10">
								<Input type="text" bsSize="sm" defaultValue={creds.secretID} disabled/>
							</Col>
						</FormGroup>
						<FormGroup row>
							<Col md="2">
								<Label>Credential</Label>
							</Col>
							<Col md="10">
								{
									creds.type === "kv" ?
										<div>
											{
												JSON.parse(creds.password).map(function (item) {
													return (
														<FormGroup key={item + "keyvalue"}>
															<InputGroup>
																<Input type="text" bsSize="sm" defaultValue={item["key"]} disabled/>
																&nbsp;
																{
																	viewPassword ? item["type"] === "image" ?
																		<div>
																			<img style={{
																				display: "block",
																				maxWidth: "200px",
																				maxHeight: "200px",
																				width: "auto",
																				height: "auto",
																				cursor: "pointer",
																			}} id="image" src={"data:image/png;base64," + item["value"]}
																			     alt="credential" onClick={this.openImage.bind(this, item["value"])}/>
																		</div> :
																		<Input type="text" bsSize="sm" disabled
																		       defaultValue={item["value"]}/> :
																		<Input type="password" bsSize="sm" disabled defaultValue={item["value"]}/>
																	
																}
																&nbsp;
																<InputGroupAddon addonType="append" onClick={this.viewPasswordToggle.bind(this, item)}>
																	<InputGroupText>
																		<i className="fa fa-eye" color="success"/>
																	</InputGroupText>
																</InputGroupAddon>
																<InputGroupAddon addonType="append" onClick={this.copy.bind(this, item["value"])}>
																	<InputGroupText>
																		<i className="fa fa-copy"/>
																	</InputGroupText>
																</InputGroupAddon>
															</InputGroup>
														</FormGroup>
													)
												}.bind(this))
											}
										</div> :
										!viewPassword ?
											<InputGroup>
												<Input type={"password"} bsSize="sm" defaultValue={creds.password}/>
												<InputGroupAddon addonType="append" onClick={this.viewPasswordToggle.bind(this)}>
													<InputGroupText>
														<i className="fa fa-eye" color="success"/>
													</InputGroupText>
												</InputGroupAddon>
												<InputGroupAddon addonType="append" onClick={this.copy.bind(this, creds.password)}>
													<InputGroupText>
														<i className="fa fa-copy"/>
													</InputGroupText>
												</InputGroupAddon>
											</InputGroup> :
											<InputGroup>
												{
													creds.type === "json" ?
														<ReactJson src={JSON.parse(creds.password)} displayDataTypes={false} name={false}
														           enableClipboard={false}/>
														: creds.type === "image" ?
														<div>
															<img style={{
																display: "block",
																maxWidth: "200px",
																maxHeight: "200px",
																width: "auto",
																height: "auto",
																cursor: "pointer"
															}} id="image" src={"data:image/png;base64," + creds.password} alt="credential"
															     onClick={this.openImage.bind(this, creds.password)}/>
														</div>
														: <Input type={"text"} bsSize="sm" defaultValue={creds.password}/>
												}
												<InputGroupAddon addonType="append" onClick={this.viewPasswordToggle.bind(this)}>
													<InputGroupText>
														<i className="fa fa-eye" color="success"/>
													</InputGroupText>
												</InputGroupAddon>
												<InputGroupAddon addonType="append" onClick={this.copy.bind(this, creds.password)}>
													<InputGroupText>
														<i className="fa fa-copy"/>
													</InputGroupText>
												</InputGroupAddon>
											</InputGroup>
								}
							
							</Col>
						</FormGroup>
					</ModalBody>
				</Modal>
				
				<Modal isOpen={showSharedWith} toggle={this.toggleSharedWith.bind(this)}
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
										<Button color="danger" style={{width: "10%", marginTop: "10px"}} className="btn-square"
										        onClick={this.restoreUser.bind(this, item)}>
											<span className="fa fa-refresh"/>
										</Button>
									</div>
								)
							}.bind(this))
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
									<InputGroupAddon addonType="append" onClick={this.onClickAddSharing.bind(this)}>
										<Button color="danger" outline>
											<i className="fa fa-times"/>
										</Button>
									</InputGroupAddon>
								</InputGroup> :
								<div>
									<Button outline color="success" onClick={this.onClickAddSharing.bind(this)}>Add</Button>&nbsp;&nbsp;
									<Button outline color="success" modal="dismiss"
									        onClick={this.updateSharedWith.bind(this)}>Submit</Button>
								</div>
						}
					
					</ModalFooter>
				</Modal>
				
				{
					owner === userData.email ?
						<AddCredential collectionName={name} addNewCred={addNewCred}
						               addCred={this.addCred.bind(this)}
						               newCredentialToggle={this.newCredentialToggle.bind(this)}/> : false
				}
				{
					isAlert ?
						<Alert message={alertMessage}
						       removeAlert={this.removeAlert.bind(this)}
						       type={alertType}/> : false
				}
			</Card>
		)
	}
}

export default CollectionCard;