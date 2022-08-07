// Next.js API route support: https://nextjs.org/docs/api-routes/introduction


// base url + tokenid 


export default function handler(req, res) {
  const { tokenId } = req.query;

  const name = `Crypto Dev #${tokenId}`;
  const description = "Crypto devs NFT for web3 developers";
  const image = `https://raw.githubusercontent.com/LearnWeb3DAO/NFT-Collection/main/my-app/public/cryptodevs/${
    Number(tokenId) - 1
  }.svg`;

  return res.json({
    name,
    description,
    image,
  });
}
