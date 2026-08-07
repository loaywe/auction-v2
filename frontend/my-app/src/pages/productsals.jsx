// pages/FixedPriceProducts.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductComplex from "./componant/prodectcomlex";
import DataFilters from "./componant/DataFilters";

 
 import FixedPriceProductsl from "./componant/productlest";

function FixedPriceProducts() {


    return (
        <div>
            <FixedPriceProductsl status="sold" />
        </div>
    );
}   


export default FixedPriceProducts;