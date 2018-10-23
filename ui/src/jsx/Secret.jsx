/**
 * Created by Satyam on 19/10/18.
 */


import React from 'react';
import {Card, CardHeader} from "reactstrap";

class Secret extends React.Component {
	constructor(props) {
		super(props);
		this.state = {}
	}
	
	render() {
		return (
			<div className="col-sm-4" style={{display: "inline-block", marginTop: "10px"}}>
				<Card className="card-accent-success">
					<CardHeader>
						Actions Details
					</CardHeader>
				</Card>
				<Card className="card-accent-success">
					<CardHeader>
						Actions Details
					</CardHeader>
				</Card>
				<Card className="card-accent-success">
					<CardHeader>
						Actions Details
					</CardHeader>
				</Card>
			</div>
		)
	}
}

export default Secret;