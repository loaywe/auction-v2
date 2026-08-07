import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import AdminTable from "./componant/AdminTable";
import DataFilters from "./componant/DataFilters";
import { useNavigate } from "react-router-dom";
 import FixedPriceProductsl from "./componant/productlest";


const baseUrl = "http://localhost:5000";

export default function DataBids() {
  return (
        <div>
            <FixedPriceProductsl status="active" />
        </div>
    );
  
}