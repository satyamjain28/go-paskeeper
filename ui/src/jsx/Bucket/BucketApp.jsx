/**
 * Created by Satyam on 23/10/18.
 */


import React from 'react';
import BucketCard from "./BucketCard";
import {Button, Col, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row} from "reactstrap";
import CryptoJS from "crypto-js";
import '../../css/bucket.css';

class BucketApp extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			allBuckets: [],
			addNew: false,
			newName: "",
			userData: props.userData
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
		fetch('/password')
			.then(function (response) {
				return response.json()
			})
			.then(function (json) {
				this.setState({
					allBuckets: json,
					addNew: false
				})
			}.bind(this))
			.catch(function (error) {
				this.setState({
					allBuckets: [],
					addNew: false
				});
				console.log(error);
				return error
			}.bind(this));
	}
	
	addBucket() {
		let name = document.getElementById("newName").value;
		let pass = document.getElementById("newPass").value;
		this.createBucket(name, pass);
		this.getDataFromAPI();
	}
	
	createBucket(name, pass) {
		let encrypted = CryptoJS.AES.encrypt("testPass", pass);
		fetch("/password", {
			method: "post",
			headers: {
				'Content-Type': 'application/json',
				'user': this.state.userData.email
			},
			body: JSON.stringify({
				secret_name: "e886689e-b810-4f07-a522-c8d6e15818b0",
				bucket: name,
				password: encrypted.toString()
			})
		}).then(response => response.json())
			.catch(function (error) {
				console.log(error);
				return error
			})
	}
	
	toggleAddNewBucket() {
		this.setState({
			addNew: !this.state.addNew
		})
	}
	
	render() {
		const {allBuckets, addNew, userData} = this.state;
		return (
			<div style={{marginTop: "10px", padding: "20px"}}>
				<div style={{width: "100%", display: "inline-block"}}>
					<Button style={{float: "right"}} onClick={this.toggleAddNewBucket.bind(this)}
					        outline color="success">
						<i className={"fa fa-plus"} style={{marginRight:"10px"}}/>New Creds
					</Button>
				</div>
				<Row>
					{
						allBuckets.map(function (item, idx) {
							return (
								<div key={idx} style={{width: "18%", margin: "5px 1%"}}>
									<BucketCard name={item} userData={userData}/>
								</div>
							)
						})
					}
				</Row>
				<Modal isOpen={addNew} toggle={this.toggleAddNewBucket.bind(this)}
				       className={'modal-success'}>
					<ModalHeader>Add Bucket</ModalHeader>
					<ModalBody>
						<FormGroup row>
							<Col md="3">
								<Label>Bucket Name</Label>
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
					</ModalBody>
					<ModalFooter>
						<Button outline size="sm" color="success" onClick={this.addBucket.bind(this)}>Add</Button>
						<Button outline size="sm" color="danger" onClick={this.toggleAddNewBucket.bind(this)}>Cancel</Button>
					</ModalFooter>
				</Modal>
			</div>
		)
	}
}

export default BucketApp;