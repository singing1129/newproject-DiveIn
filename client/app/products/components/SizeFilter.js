"use client";
import React, { useState } from "react";
import {
  Button,
  TextField,
  Typography,
  Box,
  Paper,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
} from "@mui/material";
import { styled } from "@mui/material/styles";

// 定義尺寸表
const sizeChart = {
  tops: [
    { size: "XS", height: [150, 160], weight: [40, 50] },
    { size: "S", height: [155, 165], weight: [45, 55] },
    { size: "M", height: [160, 170], weight: [50, 65] },
    { size: "L", height: [165, 175], weight: [60, 75] },
    { size: "XL", height: [170, 180], weight: [70, 85] },
    { size: "XXL", height: [175, 185], weight: [80, 100] },
  ],
  bottoms: [
    { size: "XS", height: [150, 160], weight: [40, 50] },
    { size: "S", height: [155, 165], weight: [45, 55] },
    { size: "M", height: [160, 170], weight: [50, 65] },
    { size: "L", height: [165, 175], weight: [60, 75] },
    { size: "XL", height: [170, 180], weight: [70, 85] },
    { size: "XXL", height: [175, 185], weight: [80, 100] },
  ],
  wetsuits: [
    { size: "XS", height: [150, 160], weight: [40, 50] },
    { size: "S", height: [155, 165], weight: [45, 55] },
    { size: "M", height: [160, 170], weight: [50, 65] },
    { size: "L", height: [165, 175], weight: [60, 75] },
    { size: "XL", height: [170, 180], weight: [70, 85] },
    { size: "XXL", height: [175, 185], weight: [80, 100] },
  ],
};

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
}));

const SizeFilter = () => {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [clothingType, setClothingType] = useState("tops");
  const [recommendedSize, setRecommendedSize] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const handleHeightChange = (e) => {
    setHeight(e.target.value);
    setShowResult(false);
  };

  const handleWeightChange = (e) => {
    setWeight(e.target.value);
    setShowResult(false);
  };

  const handleTypeChange = (e) => {
    setClothingType(e.target.value);
    setShowResult(false);
  };

  const findRecommendedSize = () => {
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);

    if (isNaN(heightNum) || isNaN(weightNum)) {
      return "請輸入有效的身高和體重";
    }

    const sizeList = sizeChart[clothingType];
    let recommendSize = "";

    for (const sizeOption of sizeList) {
      const [minHeight, maxHeight] = sizeOption.height;
      const [minWeight, maxWeight] = sizeOption.weight;

      if (
        heightNum >= minHeight &&
        heightNum <= maxHeight &&
        weightNum >= minWeight &&
        weightNum <= maxWeight
      ) {
        recommendSize = sizeOption.size;
        break;
      }
    }

    if (!recommendSize) {
      let closestSize = sizeList[0];
      let minDiff = Math.abs(
        heightNum - (sizeList[0].height[0] + sizeList[0].height[1]) / 2
      );

      for (const sizeOption of sizeList) {
        const avgHeight = (sizeOption.height[0] + sizeOption.height[1]) / 2;
        const diff = Math.abs(heightNum - avgHeight);
        if (diff < minDiff) {
          minDiff = diff;
          closestSize = sizeOption;
        }
      }
      recommendSize = closestSize.size + " (可能需要調整)";
    }

    return recommendSize || "無法推薦尺寸，請聯繫客服";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const size = findRecommendedSize();
    setRecommendedSize(size);
    setShowResult(true);
  };

  return (
    <StyledPaper elevation={3}>
      <Typography
        variant="h5"
        component="h2"
        gutterBottom
        align="center"
        sx={{ fontWeight: "bold", mb: 3 }}
      >
        尺寸推薦系統
      </Typography>

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <FormControl fullWidth>
            <InputLabel>服裝類型</InputLabel>
            <Select
              value={clothingType}
              label="服裝類型"
              onChange={handleTypeChange}
            >
              <MenuItem value="tops">上衣</MenuItem>
              <MenuItem value="bottoms">褲子</MenuItem>
              <MenuItem value="wetsuits">防寒衣</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="身高 (cm)"
            value={height}
            onChange={handleHeightChange}
            type="number"
            required
            slotProps={{
              input: {
                min: 100,
                max: 220,
              },
            }}
          />

          <TextField
            fullWidth
            label="體重 (kg)"
            value={weight}
            onChange={handleWeightChange}
            type="number"
            required
            slotProps={{
              input: {
                min: 30,
                max: 150,
              },
            }}
          />

          <Button
            variant="contained"
            type="submit"
            fullWidth
            sx={{
              py: 1.5,
              fontSize: "1rem",
              bgcolor: "#0288d1",
              "&:hover": {
                bgcolor: "#01579b",
              },
            }}
          >
            計算推薦尺寸
          </Button>
        </Stack>
      </form>

      {showResult && recommendedSize && (
        <Box
          sx={{
            mt: 4,
            p: 2,
            bgcolor: "rgba(2, 136, 209, 0.1)",
            borderRadius: 2,
            textAlign: "center",
          }}
        >
          <Typography variant="h6" gutterBottom>
            推薦尺寸:
          </Typography>
          <Typography
            variant="h5"
            sx={{ fontWeight: "bold", color: "#0288d1" }}
          >
            {recommendedSize.split(" ")[0]} {/* XXL */}
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontWeight: "bold", color: "#0288d1" }}
          >
            {recommendedSize.split(" ")[1] || ""}
          </Typography>

          <Typography variant="body2" sx={{ mt: 2, fontStyle: "italic" }}>
            此建議僅供參考，實際尺寸可能因品牌和款式而有所不同。
          </Typography>
        </Box>
      )}

      <Box sx={{ mt: 4 }}>
        <Typography variant="subtitle2" color="text.secondary" align="center">
          如有疑問，請聯絡我們的客服團隊獲取更精確的尺寸建議。
        </Typography>
      </Box>
    </StyledPaper>
  );
};

export default SizeFilter;
