/**
 * Created by Satyam on 23/10/18.
 */


import React from 'react';
import {
	Button,
	Card,
	CardBody,
	Col,
	FormGroup,
	Input,
	Label,
	Modal,
	ModalBody,
	ModalFooter,
	ModalHeader,
	Row
} from "reactstrap";
import Alert from "../Alert/Alert";
import Loader from 'react-loader-spinner';

const green = "#4dbd74";

class AddCredential extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			addNewCred: false,
			collectionName: props.collectionName,
			type: "none",
			kvList: [],
			isAlert: false,
			alertMessage: "",
			alertType: "danger",
			imageBinary: "",
			newKVType: "",
			isLoader: false
		}
	}
	
	componentWillReceiveProps(nextProps) {
		this.setState({
			collectionName: nextProps.collectionName,
			addNewCred: nextProps.addNewCred,
			isLoader: false
		})
	}
	
	toggleCredsModal() {
		this.props.newCredentialToggle();
	}
	
	static isJson(str) {
		try {
			JSON.parse(str);
		} catch (e) {
			return false;
		}
		return true;
	}
	
	addCred() {
		let type = this.state.type;
		let data = {};
		if (type === "none") {
			this.setState({
				isAlert: true,
				alertMessage: "Please choose the type of credential",
				alertType: "danger",
			});
			return
		}
		let name = document.getElementById("newName").value;
		if (name === "") {
			this.setState({
				isAlert: true,
				alertMessage: "Please provide a name for the credential",
				alertType: "danger",
			});
			return
		}
		if (type === "string") {
			data = {
				collection: this.state.collectionName,
				credential: document.getElementById("newCred").value,
				name: name,
				type: this.state.type
			};
		} else if (type === "json") {
			let cred = document.getElementById("newCred").value;
			if (AddCredential.isJson(cred)) {
				data = {
					collection: this.state.collectionName,
					credential: cred,
					name: name,
					type: this.state.type
				};
			} else {
				this.setState({
					isAlert: true,
					alertMessage: "Invalid json value",
					alertType: "danger",
				});
			}
		} else if (type === "kv") {
			if (this.state.kvList.length === 0) {
				this.setState({
					isAlert: true,
					alertMessage: "No key value pair added",
					alertType: "danger",
				});
				return
			}
			data = {
				collection: this.state.collectionName,
				credential: JSON.stringify(this.state.kvList),
				name: name,
				type: this.state.type
			};
		} else if (type === "image") {
			if (this.state.imageBinary === "") {
				this.setState({
					isAlert: true,
					alertMessage: "No image uploaded",
					alertType: "danger",
				});
				return
			}
			data = {
				collection: this.state.collectionName,
				credential: this.state.imageBinary,
				name: name,
				type: this.state.type
			};
		}
		this.setState({
			kvList: [],
			type: "none",
			isLoader: true
		}, function () {
			this.props.addCred(data);
		});
	}
	
	onTypeChange() {
		this.setState({
			type: document.getElementById("newType").value
		})
	}
	
	onAddKV() {
		let key = document.getElementById("newKey").value;
		let kvType = document.getElementById("newKVType").value;
		let value = "";
		if (kvType === "string") {
			value = document.getElementById("newValue").value;
		} else {
			value = this.state.imageBinary;
		}
		if (key === "" || value === "" || kvType === "") {
			this.setState({
				isAlert: true,
				alertMessage: "Key,type or value can't be empty",
				alertType: "danger",
			});
			return
		}
		let kv = this.state.kvList;
		let result = kv.filter(x => x.key === key);
		if (result.length === 0) {
			let a = {
				"key": key,
				"type": kvType,
				"value": value
			};
			kv.push(a);
			this.setState({
				kvList: kv
			}, function () {
				document.getElementById("newKey").value = "";
				document.getElementById("newKVType").value = "";
				if (kvType === "image") {
					document.getElementById("newImage").value = "";
					this.setState({
						imageBinary: ""
					});
				} else {
					document.getElementById("newValue").value = "";
				}
				
			}.bind(this));
		} else {
			this.setState({
				isAlert: true,
				alertMessage: "Key Already Exists",
				alertType: "danger",
			});
		}
	}
	
	onRemoveClicked(item) {
		let kv = this.state.kvList;
		for (let v in kv) {
			if (kv.hasOwnProperty(v)) {
				if (kv[v].key === item) {
					kv.splice(v, 1);
					break;
				}
			}
		}
		this.setState({
			kvList: kv
		})
	}
	
	removeAlert() {
		this.setState({
			isAlert: false,
			alertMessage: "",
			alertType: "danger",
		})
	}
	
	imageUpload(e) {
		const files = Array.from(e.target.files);
		let reader = new FileReader();
		let file = files[0];
		if (file.size > 5 * 1024 * 1024) {
			this.setState({
				isAlert: true,
				alertMessage: "Image size more than 5 MB",
				alertType: "danger",
			});
			return
		}
		reader.readAsArrayBuffer(file);
		reader.onload = function () {
			let arrayBuffer = reader.result;
			let bytes = new Uint8Array(arrayBuffer);
			let base64String = btoa(bytes.reduce((data, byte) => data + String.fromCharCode(byte), ''));
			this.setState({
				imageBinary: base64String
			})
		}.bind(this);
	}
	
	onKVTypeChange() {
		let kvType = document.getElementById("newKVType").value;
		this.setState({
			newKVType: kvType
		})
	}
	
	render() {
		let {collectionName, type, addNewCred, kvList, isAlert, alertType, alertMessage, newKVType, isLoader} = this.state;
		return (
			<div>
				<Modal isOpen={addNewCred} toggle={this.toggleCredsModal.bind(this)}
				       size={"lg"}
				       className={'modal-success'}>
					<ModalHeader>Add Credential</ModalHeader>
					<ModalBody>
						<FormGroup row>
							<Col md="2">
								<Label>Collection</Label>
							</Col>
							<Col md="10">
								<Input value={collectionName} disabled bsSize="sm"/>
							</Col>
						</FormGroup>
						<FormGroup row>
							<Col md="2">
								<Label>Type</Label>
							</Col>
							<Col md="10">
								<Input type="select" id="newType" bsSize="sm" selected={type} onChange={this.onTypeChange.bind(this)}>
									<option value="none">Choose the cred type</option>
									<option value="string">String</option>
									<option value="json">JSON</option>
									<option value="kv">Key Value</option>
									<option value="image">Image</option>
								</Input>
							</Col>
						</FormGroup>
						{
							type === "none" ?
								false :
								<FormGroup row>
									<Col md="2">
										<Label>Name</Label>
									</Col>
									<Col md="10">
										<Input type="text" id="newName" bsSize="sm" placeholder="Name of the credential..."/>
									</Col>
								</FormGroup>
						}
						{
							type === "string" || type === "json" ?
								<FormGroup row>
									<Col md="2">
										<Label>Credential</Label>
									</Col>
									<Col md="10">
										{
											type === "string" ?
												<Input type="text" bsSize="sm" id="newCred" placeholder="Paste the credentials here..."/>
												:
												<Input type="textarea" bsSize="sm" id="newCred" rows="9"
												       placeholder="Paste the credentials here..."/>
										}
									</Col>
								</FormGroup>
								: type === "kv" ?
								<FormGroup row>
									<Col md="2">
										<Label>Credential</Label>
									</Col>
									<Col md="10">
										<Card>
											<CardBody>
												{
													kvList.map(function (item) {
														return (
															<FormGroup key={item["key"] + "keyvalue"}>
																<Row>
																	<Col xs="4">
																		<Input type="text" bsSize="sm" defaultValue={item["key"]} disabled/>
																	</Col>
																	<Col xs="2">
																		<Input type="text" bsSize="sm" defaultValue={item["type"]} disabled/>
																	</Col>
																	<Col xs="4">
																		{
																			item["type"] === "image" ?
																				<img style={{
																					display: "block",
																					maxWidth: "190px",
																					maxHeight: "190px",
																					width: "auto",
																					height: "auto",
																					cursor: "pointer",
																				}} id="image" src={"data:image/png;base64," + item["value"]}
																				     alt="cred"/> :
																				<Input type="textarea" bsSize="sm" defaultValue={item["value"]} disabled/>
																		}
																	</Col>
																	<Col xs="2">
																		<Button color="danger" size="sm"
																		        onClick={this.onRemoveClicked.bind(this, item["key"])}>Del</Button>
																	</Col>
																</Row>
															</FormGroup>
														)
													}.bind(this))
												}
												<Row>
													<Col xs="4">
														<Input type="text" bsSize="sm" id="newKey" placeholder="Key"/>
													</Col>
													<Col xs="2">
														<Input type="select" id="newKVType" bsSize="sm" selected={type}
														       onChange={this.onKVTypeChange.bind(this)}>
															<option value="none">Choose the kv type</option>
															<option value="string">String</option>
															<option value="image">Image</option>
														</Input>
													</Col>
													{
														newKVType === "image" ?
															<Col xs="4">
																<Input bsSize="sm" type='file' id="newImage" accept="image/*" color="secondary"
																       onChange={this.imageUpload.bind(this)}/>
															</Col>
															:
															<Col xs="4">
																<Input type="textarea" bsSize="sm" id="newValue" placeholder="Value"/>
															</Col>
													}
													<Col xs="2">
														<Button color="success" size="sm"
														        onClick={this.onAddKV.bind(this)}>Add</Button>
													</Col>
												</Row>
											</CardBody>
										</Card>
									</Col>
								</FormGroup>
								: type === "image" ?
									<FormGroup row>
										<Col md="2">
											<Label>Credential</Label>
										</Col>
										<Col md="10">
											<Input bsSize="sm" type='file' id='image' accept="image/*" color="secondary"
											       onChange={this.imageUpload.bind(this)}/>
										</Col>
									</FormGroup>
									: false
						}
					</ModalBody>
					{
						isLoader ?
							<ModalFooter>
								<Loader
									type="ThreeDots"
									color={green}
									height="70"
									width="70"
								/>
							</ModalFooter> :
							<ModalFooter>
								<Button outline size="sm" color="success" onClick={this.addCred.bind(this)}>Add</Button>
								<Button outline size="sm" color="danger" onClick={this.toggleCredsModal.bind(this)}>Cancel</Button>
							</ModalFooter>
					}
				</Modal>
				{
					isAlert ?
						<Alert message={alertMessage}
						       removeAlert={this.removeAlert.bind(this)}
						       type={alertType}/> : false
				}
			</div>
		);
	}
}

export default AddCredential;