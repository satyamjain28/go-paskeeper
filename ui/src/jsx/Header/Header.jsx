/**
 * Created by Satyam on 19/10/18.
 */

import React, {Component} from 'react';
import {Nav} from 'reactstrap';

import request from 'superagent';


class Header extends Component {
	
	constructor(props) {
		super(props);
		this.state = {
			userData: props.userData,
			orgId: props.orgId,
			show: false,
		}
	}
	
	componentDidMount() {
		this.getDataFromAPI();
	}
	
	getDataFromAPI() {
		request.get('/session')
			.set('Content-Type', 'application/json')
			.end(function (err, res) {
				if (err) {
					console.log(err);
					return;
				}
				console.log(res.text);
			});
	}
	
	componentWillReceiveProps(nextProps) {
		this.setState({
			userData: nextProps.userData,
		})
	}
	
	toggle() {
		this.setState({
			show: !this.state.show
		})
	}
	
	
	render() {
		return (
			<header className="app-header navbar">
				<div className="header-css">Password Manager</div>
				<Nav className="ml-auto" navbar>
				</Nav>
			</header>
		)
	}
}

export default Header;
