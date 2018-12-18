/**
 * Created by Satyam on 23/10/18.
 */


import React from 'react';
import Header from "./Header/Header";
import CollectionApp from "./Collection/CollectionApp";

class FullApp extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			userData: {},
		}
	}
	
	componentDidMount() {
		this.getDataFromAPI();
	}
	
	getDataFromAPI() {
		fetch('/session')
			.catch(function (a) {
				console.log(a);
				return a
			})
			.then(function (response) {
				return response.json()
			})
			.then(function (userData) {
				this.setState({
					userData: userData
				})
			}.bind(this))
			.catch(function (error) {
				console.log(error);
				return error
			})
	}
	
	render() {
		const {userData} = this.state;
		return (
			<div>
				{
					Object.keys(userData).length === 0 ? false :
						<div>
							<Header userData={userData}/>
							<CollectionApp userData={userData}/>
						</div>
				}
			</div>
		)
	}
}

export default FullApp;