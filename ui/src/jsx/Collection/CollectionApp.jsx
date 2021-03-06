/**
 * Created by Satyam on 23/10/18.
 */


import React from 'react';
import CollectionCard from "./CollectionCard";
import {Button, Col, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row} from "reactstrap";
import CryptoJS from "crypto-js";
import '../../css/collection.css';
import Alert from "../Alert/Alert";

class CollectionApp extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			allCollections: [],
			addNew: false,
			newName: "",
			userData: props.userData,
			isAlert: false,
			alertType: "danger",
			alertMessage: ""
		}
	}
	
	componentWillReceiveProps(nextProps) {
		this.setState({
			userData: nextProps.userData
		})
	}
	
	componentDidMount() {
		this.getDataFromAPI();
	}
	
	getDataFromAPI() {
		fetch('/collection', {
			headers: {
				'Content-Type': 'application/json',
				'user': this.state.userData.email
			}
		})
			.then(function (response) {
				return response.json()
			})
			.then(function (json) {
				if (json !== null) {
					this.setState({
						allCollections: json,
						addNew: false
					})
				}
			}.bind(this))
			.catch(function (error) {
				this.setState({
					allCollections: [],
					addNew: false
				});
				console.log(error);
				return error
			}.bind(this));
	}
	
	static validatePassword(password) {
		let regex = [];
		regex.push("[A-Z]");
		regex.push("[a-z]");
		regex.push("[0-9]");
		regex.push("[$@$!%*#?&]");
		let passed = 0;
		for (let i = 0; i < regex.length; i++) {
			if (new RegExp(regex[i]).test(password)) {
				passed++;
			}
		}
		return (passed >= 4 && password.length >= 8);
	}
	
	addCollection() {
		let name = document.getElementById("newName").value;
		let pass = document.getElementById("newPass").value;
		let sharedUsers = document.getElementById("shared").value;
		let userList = sharedUsers.split(",");
		if (CollectionApp.validatePassword(pass)) {
			this.createCollection(name, pass, userList);
		} else {
			this.setState({
				isAlert: true,
				alertMessage: "Invalid password as per the password policy",
				alertType: "danger"
			})
		}
	}
	
	createCollection(name, pass, userList) {
		let encrypted = CryptoJS.AES.encrypt("testPass", pass);
		fetch("/collection", {
			method: "post",
			headers: {
				'Content-Type': 'application/json',
				'user': this.state.userData.email
			},
			body: JSON.stringify({
				secret_name: "e886689e-b810-4f07-a522-c8d6e15818b0",
				collection: name,
				password: encrypted.toString(),
				shared: userList,
				type: "string"
			})
		}).then(function (response) {
			return response.json()
		}).then(responseData => this.getDataFromAPI()).catch(function (error) {
			console.log(error);
			return error
		})
	}
	
	removeAlert() {
		this.setState({
			isAlert: false,
			alertMessage: "",
			alertType: "danger"
		})
	}
	
	toggleAddNewCollection() {
		this.setState({
			addNew: !this.state.addNew
		})
	}
	
	render() {
		const {allCollections, addNew, userData, isAlert, alertMessage, alertType} = this.state;
		return (
			<div style={{marginTop: "10px", padding: "20px"}}>
				<div style={{width: "100%", display: "inline-block"}}>
					<Button style={{float: "right"}} onClick={this.toggleAddNewCollection.bind(this)}
					        outline color="success">
						<i className={"fa fa-plus"} style={{marginRight: "10px"}}/>New Cred Group
					</Button>
				</div>
				<Row>
					{
						allCollections.map(function (item, idx) {
							return (
								<div key={idx} style={{width: "18%", margin: "5px 1%"}}>
									<CollectionCard name={item} userData={userData}/>
								</div>
							)
						})
					}
				</Row>
				<Modal isOpen={addNew} toggle={this.toggleAddNewCollection.bind(this)}
				       className={'modal-success'}>
					<ModalHeader>Add Collection</ModalHeader>
					<ModalBody>
						<FormGroup row>
							<Col md="3">
								<Label>Collection Name</Label>
							</Col>
							<Col md="9">
								<Input id="newName"/>
							</Col>
						</FormGroup>
						<FormGroup row>
							<Col md="3">
								<Label>Password</Label>
							</Col>
							<Col md="9">
								<Input type="password" id="newPass"/>
							</Col>
						</FormGroup>
						<FormGroup row>
							<Col md="3">
								<Label>Share With</Label>
							</Col>
							<Col md="9">
								<Input type="textarea" id="shared" rows="2" placeholder="Add comma separated list of users..."/>
							</Col>
						</FormGroup>
					</ModalBody>
					<ModalFooter>
						<Button outline size="sm" color="success" modal="dismiss"
						        onClick={this.addCollection.bind(this)}>Add</Button>
						<Button outline size="sm" color="danger" onClick={this.toggleAddNewCollection.bind(this)}>Cancel</Button>
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

export default CollectionApp;