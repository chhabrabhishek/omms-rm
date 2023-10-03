import { Box, BoxProps } from "@chakra-ui/react";

const polkaStyle = {
  backgroundColor: "#fff",
  backgroundImage: `
    radial-gradient(#ea819088 0.5px, transparent 0.5px),
    radial-gradient(#ea819088 0.5px, #fff 0.5px)
  `,
  backgroundSize: "18px 18px",
  backgroundPosition: "0 0, 10px 10px",
};

const accentProps = {
  borderTop: "4px",
  borderColor: "#f78ca0",
};

export function Canvas(
  props: BoxProps & {
    accent?: boolean;
    polka?: boolean;
    stretched?: boolean;
  }
) {
  const { accent, polka, stretched, ...rest } = props;

  return (
    <Box
      style={polka && polkaStyle}
      {...(accent && accentProps)}
      {...(stretched && { minH: "100vh" })}
      {...rest}
    />
  );
}
