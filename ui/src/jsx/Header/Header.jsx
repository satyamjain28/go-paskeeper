/**
 * Created by Satyam on 19/10/18.
 */

import React, {Component} from 'react';
import {Nav} from 'reactstrap';

import HeaderDropdown from "./HeaderDropdown";


class Header extends Component {
	
	constructor(props) {
		super(props);
		this.state = {
			userData: props.userData
		}
	}
	
	componentWillReceiveProps(nextProps) {
		this.setState({
			userData: nextProps.userData,
		})
	}
	
	render() {
		return (
			<header className="app-header navbar">
				<div className="header-css">Password Manager</div>
				<Nav className="ml-auto" navbar>
					<HeaderDropdown userData={this.state.userData}/>
				</Nav>
			</header>
		)
	}
}

export default Header;
