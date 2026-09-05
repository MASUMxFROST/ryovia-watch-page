import React from "react";
import Card from "../Card/Card";
import "./main-container.css";
export default function AnimeCollection(props) {
  const cards = props.data.map((data) => {
    return <Card key={data.id} data={data} />;
  });
  return (
    <div className="anime-collection-wrapper">
      <div className="collection-heading">
        <h2>{props.collectionName}</h2>
        <span>{props.data.length} series</span>
      </div>
      <div className="card-wrapper">{cards}</div>
    </div>
  );
}
