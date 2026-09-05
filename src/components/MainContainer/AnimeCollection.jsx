import React from "react";
import Card from "../Card/Card";
import "./main-container.css";
export default function AnimeCollection({ data = [], collectionName }) {
  const cards = data.map((data) => {
    return <Card key={data.id} data={data} />;
  });
  return (
    <div className="anime-collection-wrapper">
      <div className="collection-heading">
        <h2>{collectionName}</h2>
        <span>{data.length} titles</span>
      </div>
      <div className="card-wrapper">{cards}</div>
    </div>
  );
}
