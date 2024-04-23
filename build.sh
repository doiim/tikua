# Remove old output (if any)
rm -rf ./dist

node ./scripts/fetchDeployments.mjs

# TypeScript compilations
npx tsc -p tsconfig.esm.json
npx tsc -p tsconfig.cjs.json

cat > ./dist/cjs/package.json <<!EOF
{
    "type": "commonjs"
}
!EOF

# cat > ./dist/esm/package.json <<!EOF
# {
#     "type": "module"
# }
# !EOF

cp -rfp src/abis/ ./dist/abis
cp -rfp src/deployments/ ./dist/deployments