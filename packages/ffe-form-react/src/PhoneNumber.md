Telefonnummer med landskode

```js
<PhoneNumber number="123123123" />
```

Variant _dark_ for interne løsninger med mørk bakgrunn.

```js { "props": { "className": "sb1ds-example-dark" } }
<PhoneNumber dark={true} number="22882288" />
```

PhoneNumber med feilmelding på landkode

```js
const { PhoneNumber } = require('.');

<PhoneNumber
    number="12345678"
    countryCode=""
    countryCodeFieldMessage="Dette feltet er påkrevd"
/>;
```

PhoneNumber med feilmelding på telefonnummer

```js
const { PhoneNumber } = require('.');

<PhoneNumber
    number=""
    countryCode="47"
    numberFieldMessage="Dette feltet er påkrevd"
/>;
```

PhoneNumber med felles feilmelding på landkode og telefonnummer

```js
const { PhoneNumber } = require('.');

<PhoneNumber
    number=""
    countryCode=""
    countryCodeAndNumberFieldMessage="Både landkode og telefonnummer feltene er påkrevd"
/>;
```
