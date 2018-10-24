/**
 * Created by Satyam on 23/10/18.
 */

import React, {Component} from 'react';
import {Dropdown, DropdownItem, DropdownMenu, DropdownToggle} from 'reactstrap';

class HeaderDropdown extends Component {
	
	constructor(props) {
		super(props);
		this.toggle = this.toggle.bind(this);
		this.state = {
			dropdownOpen: false,
			userData: props.userData
		};
	}
	
	toggle() {
		this.setState({
			dropdownOpen: !this.state.dropdownOpen
		});
	}
	
	componentWillReceiveProps(nextProps) {
		this.setState({
			userData: nextProps.userData
		})
	}
	
	signout() {
		this.props.signOutUser();
	}
	
	dropAccount() {
		return (
			<Dropdown isOpen={this.state.dropdownOpen} toggle={this.toggle} nav>
				<DropdownToggle nav>
					<img
						src={this.state.userData.image}
						className="img-avatar"
						alt="User"/>
				</DropdownToggle>
				<DropdownMenu right style={{marginTop: "10px"}}>
					<DropdownItem href="/signout"><i className="fa fa-lock"/>Logout</DropdownItem>
				</DropdownMenu>
			</Dropdown>
		);
	}
	
	render() {
		return (
			this.dropAccount()
		);
	}
}

export default HeaderDropdown;
