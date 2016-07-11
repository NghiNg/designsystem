import React, { PropTypes } from 'react';

import InfoSirkelIkon from 'ffe-icons-react/info-sirkel-ikon';

import Base from './base';

export default function SystemErrorMessage({ children }) {
    const ikon = (
        <InfoSirkelIkon style={{ transform: 'rotateX(180deg)' }} />
    );
    return (
        <Base modifier="error" icon={ikon}>
            {children}
        </Base>
    );
}

SystemErrorMessage.propTypes = {
    children: PropTypes.node.isRequired,
};
