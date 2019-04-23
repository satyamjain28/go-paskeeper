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


class AddCredential extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			addNewCred: false,
			collectionName: props.collectionName,
			type: "none",
			kvList: {},
			isAlert: false,
			alertMessage: "",
			alertType: "danger"
		}
	}
	
	componentWillReceiveProps(nextProps) {
		this.setState({
			collectionName: nextProps.collectionName,
			addNewCred: nextProps.addNewCred
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
		let name = document.getElementById("newName").value;
		let data = {};
		if (type === "none") {
			this.setState({
				isAlert: true,
				alertMessage: "Please choose the type of credential",
				alertType: "danger",
			});
			return
		}
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
		}
		else {
			if (Object.keys(this.state.kvList).length === 0) {
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
		}
		this.props.addCred(data);
		this.setState({
			kvList: {},
			type: "none"
		})
	}
	
	onTypeChange() {
		this.setState({
			type: document.getElementById("newType").value
		})
	}
	
	onAddKV() {
		let key = document.getElementById("newKey").value;
		let value = document.getElementById("newValue").value;
		if (key === "" || value === "") {
			this.setState({
				isAlert: true,
				alertMessage: "Key or Value can't be empty string",
				alertType: "danger",
			});
			return
		}
		let kv = this.state.kvList;
		let preExisting = false;
		if (Object.keys(kv).indexOf(key) !== -1) {
			preExisting = true
		}
		if (!preExisting) {
			kv[key] = value;
			this.setState({
				kvList: kv
			}, function () {
				document.getElementById("newKey").value = "";
				document.getElementById("newValue").value = "";
			});
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
		delete kv[item];
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
	
	render() {
		let {collectionName, type, addNewCred, kvList, isAlert, alertType, alertMessage} = this.state;
		return (
			<div>
				<Modal isOpen={addNewCred} toggle={this.toggleCredsModal.bind(this)}
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
													Object.keys(kvList).map(function (item) {
														return (
															<FormGroup key={item + "keyvalue"}>
																<Row>
																	<Col xs="5">
																		<Input type="text" bsSize="sm" defaultValue={item} disabled/>
																	</Col>
																	<Col xs="5">
																		<Input type="textarea" bsSize="sm" defaultValue={kvList[item]} disabled/>
																	</Col>
																	<Col xs="2">
																		<Button color="danger" size="sm"
																		        onClick={this.onRemoveClicked.bind(this, item)}>Del</Button>
																	</Col>
																</Row>
															</FormGroup>
														)
													}.bind(this))
												}
												<Row>
													<Col xs="5">
														<Input type="text" bsSize="sm" id="newKey" placeholder="Key"/>
													</Col>
													<Col xs="5">
														<Input type="textarea" bsSize="sm" id="newValue" placeholder="Value"/>
													</Col>
													<Col xs="2">
														<Button color="success" size="sm"
														        onClick={this.onAddKV.bind(this)}>Add</Button>
													</Col>
												</Row>
											</CardBody>
										</Card>
									</Col>
								</FormGroup> : false
						}
					</ModalBody>
					<ModalFooter>
						<Button outline size="sm" color="success" onClick={this.addCred.bind(this)}>Add</Button>
						<Button outline size="sm" color="danger" onClick={this.toggleCredsModal.bind(this)}>Cancel</Button>
					</ModalFooter>
				</Modal>
				{
					isAlert ?
						<Alert message={alertMessage}
						       removeAlert={this.removeAlert.bind(this)}
						       type={alertType}/> : false
				}
			</div>
		)
	}
}

export default AddCredential;