/**
 * Created by Satyam on 23/10/18.
 */


import React from 'react';
import {Button, Col, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader} from "reactstrap";


class AddCredential extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			addNewCred: props.addNewCred,
			collectionName: props.collectionName
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
	
	addCred() {
		let data = {
			collection: this.state.collectionName,
			credential: document.getElementById("newCred").value,
			name: document.getElementById("newName").value,
			type: document.getElementById("newType").value
		};
		this.props.addCred(data);
	}
	
	render() {
		return (
			<div>
				<Modal isOpen={this.state.addNewCred} toggle={this.toggleCredsModal.bind(this)}
				       className={'modal-success'}>
					<ModalHeader>Add Credential</ModalHeader>
					<ModalBody>
						<FormGroup row>
							<Col md="2">
								<Label>Collection</Label>
							</Col>
							<Col md="10">
								<Input value={this.state.collectionName} disabled/>
							</Col>
						</FormGroup>
						<FormGroup row>
							<Col md="2">
								<Label>Name</Label>
							</Col>
							<Col md="10">
								<Input type="text" id="newName" placeholder="Name of the credential..."/>
							</Col>
						</FormGroup>
						<FormGroup row>
							<Col md="2">
								<Label>Credential</Label>
							</Col>
							<Col md="10">
								<Input type="textarea" id="newCred" rows="9" placeholder="Paste the credentials here..."/>
							</Col>
						</FormGroup>
						<FormGroup row>
							<Col md="2">
								<Label>Type</Label>
							</Col>
							<Col md="10">
								<Input type="text" id="newType" placeholder="Type of credential..."/>
							</Col>
						</FormGroup>
					</ModalBody>
					<ModalFooter>
						<Button outline size="sm" color="success" onClick={this.addCred.bind(this)}>Add</Button>
						<Button outline size="sm" color="danger" onClick={this.toggleCredsModal.bind(this)}>Cancel</Button>
					</ModalFooter>
				</Modal>
			</div>
		)
	}
}

export default AddCredential;