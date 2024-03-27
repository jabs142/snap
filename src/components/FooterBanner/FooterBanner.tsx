import React from "react";
import { Flex, Text } from "@aws-amplify/ui-react";

const FooterBanner: React.FC = () => {
  return (
    <Flex
      justifyContent="center"
      alignItems="center"
      padding="10px"
      backgroundColor="#E1ECF0"
      marginTop="50px"
    >
      <Text fontSize="16px" color="#666">
        This is a FooterBanner
      </Text>
    </Flex>
  );
};

export default FooterBanner;
