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
			bucketName: props.bucketName
		}
	}
	
	componentWillReceiveProps(nextProps) {
		this.setState({
			bucketName: nextProps.bucketName,
			addNewCred: nextProps.addNewCred
		})
	}
	
	toggleCredsModal() {
		this.props.newCredentialToggle();
	}
	
	addCred() {
		let data = {
			bucket: this.state.bucketName,
			credential: document.getElementById("newCred").value,
			name: document.getElementById("newName").value
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
								<Label>Bucket</Label>
							</Col>
							<Col md="10">
								<Input value={this.state.bucketName} disabled/>
							</Col>
						</FormGroup>
						{/*<FormGroup row>*/}
							{/*<Col md="2">*/}
								{/*<Label>Type</Label>*/}
							{/*</Col>*/}
							{/*<Col md="10">*/}
								{/*<Input type="select" id="credType" bsSize="sm">*/}
									{/*<option value="text">Text</option>*/}
									{/*<option value="json">JSON</option>*/}
								{/*</Input>*/}
							{/*</Col>*/}
						{/*</FormGroup>*/}
						<FormGroup row>
							<Col md="2">
								<Label>Name</Label>
							</Col>
							<Col md="10">
								<Input type="text" id="newName" rows="9" placeholder="Name of the credential..."/>
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