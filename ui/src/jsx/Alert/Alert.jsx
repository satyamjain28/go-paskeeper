/**
 * Created by Satyam on 24/10/18.
 */

import React from 'react';
import {Button, Modal, ModalBody, ModalFooter, ModalHeader} from "reactstrap";

class Alert extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			message: props.message,
			type: props.type || 'danger'
		}
	}
	
	componentWillReceiveProps(nextProps) {
		this.setState({
			message: nextProps.message,
			type: nextProps.type || this.props.type || 'danger'
		});
	}
	
	removeAlert() {
		this.props.removeAlert();
	}
	
	
	render() {
		return (
			<div>
				<Modal toggle={this.removeAlert.bind(this)} isOpen={true}
				       className={'modal-' + this.state.type}>
					<div>
						<ModalHeader toggle={this.removeAlert.bind(this)}>Alert</ModalHeader>
						<ModalBody>
							{this.state.message}
						</ModalBody>
						<ModalFooter>
							<Button outline color={this.state.type}
							        onClick={this.removeAlert.bind(this)}>Okay!</Button>
						</ModalFooter>
					</div>
				</Modal>
			</div>
		)
	}
}

export default Alert;