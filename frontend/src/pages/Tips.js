import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import PageHero from "../components/PageHero";
import { pageContainer, card, heading } from "../utils/pageStyles";

const TIPS = [
  {
    category: "Diet Choices",
    icon: "\uD83E\uDD57",
    color: "#2d6a4f",
    bg: "#edf7f0",
    tips: [
      {
        title: "Embrace Plant-Based Meals",
        text: "Shifting just one meal a day to plant-based can reduce your food carbon footprint by up to 25%. Legumes, tofu, and tempeh are protein-rich alternatives.",
      },
      {
        title: "Choose Seasonal & Local Produce",
        text: "Seasonal fruits and vegetables require less energy-intensive storage and transport. Visit local farmers' markets for the freshest options.",
      },
      {
        title: "Reduce Red Meat Consumption",
        text: "Beef production generates 20x more greenhouse gases than plant proteins. Try swapping beef for chicken or fish as a first step.",
      },
      {
        title: "Explore Whole Grains",
        text: "Whole grains like brown rice, quinoa, and oats have lower processing emissions and provide more nutrients than refined alternatives.",
      },
    ],
  },
  {
    category: "Shopping Smart",
    icon: "\uD83D\uDED2",
    color: "#b45309",
    bg: "#fef3c7",
    tips: [
      {
        title: "Read the GreenGrade",
        text: "Use Consciobite's GreenGrade score to quickly identify sustainable products. Scores of 7+ indicate low environmental impact.",
      },
      {
        title: "Buy in Bulk",
        text: "Buying larger quantities reduces per-unit packaging waste and transportation emissions. Store properly to avoid spoilage.",
      },
      {
        title: "Choose Minimal Packaging",
        text: "Products with less packaging generate fewer emissions. Bring reusable bags and containers when shopping.",
      },
      {
        title: "Plan Your Meals",
        text: "Meal planning reduces impulse purchases and food waste. A well-planned week of meals can cut your food waste by up to 50%.",
      },
    ],
  },
  {
    category: "Food Waste",
    icon: "\u267B\uFE0F",
    color: "#0d9488",
    bg: "#f0fdfa",
    tips: [
      {
        title: "Understand Date Labels",
        text: "'Best before' doesn't mean 'unsafe after'. Most foods are still good past their best-before date. Use your senses to judge freshness.",
      },
      {
        title: "Store Food Correctly",
        text: "Proper storage extends food life significantly. Keep herbs in water, wrap cheese in wax paper, and store tomatoes at room temperature.",
      },
      {
        title: "Compost Kitchen Scraps",
        text: "Composting diverts organic waste from landfills where it produces methane. Even apartment dwellers can use bokashi or worm bins.",
      },
      {
        title: "Use Leftovers Creatively",
        text: "Transform leftovers into new meals. Yesterday's rice becomes fried rice, overripe bananas become banana bread, and veggie scraps make stock.",
      },
    ],
  },
  {
    category: "Kitchen Habits",
    icon: "\uD83C\uDF73",
    color: "#7c3aed",
    bg: "#f5f3ff",
    tips: [
      {
        title: "Cook Efficiently",
        text: "Use lids on pots to reduce cooking time by 25%. Batch cook staples like grains and beans to save energy throughout the week.",
      },
      {
        title: "Use Energy-Efficient Appliances",
        text: "Pressure cookers use 70% less energy than conventional cooking. Microwaves are more efficient for reheating than ovens.",
      },
      {
        title: "Minimize Water Waste",
        text: "Don't run water continuously while washing dishes or produce. A basin of water for washing uses 50% less than a running tap.",
      },
      {
        title: "Choose Reusable Over Disposable",
        text: "Replace single-use items like cling wrap with beeswax wraps, paper towels with cloth, and disposable bags with silicone ones.",
      },
    ],
  },
];

const FUN_FACTS = [
  { stat: "26%", label: "of global greenhouse gas emissions come from food production" },
  { stat: "1/3", label: "of all food produced globally is wasted each year" },
  { stat: "70%", label: "of freshwater withdrawals are used for agriculture" },
  { stat: "50%", label: "of habitable land is used for farming" },
  { stat: "80%", label: "of deforestation is driven by agricultural expansion" },
  { stat: "14.5%", label: "of emissions come from livestock alone" },
];

export default function Tips() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [expandedCategory, setExpandedCategory] = useState(0);

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon={"\uD83C\uDF31"}
        title="Sustainability Tips"
        subtitle="Practical ways to reduce your food's environmental footprint, one meal at a time."
      />

      <div style={pageContainer(720)}>
        {/* Fun Facts Carousel */}
        <div
          style={{
            ...card(isDark, { padding: "20px 24px" }),
            marginTop: -20,
            marginBottom: 24,
            animation: "fadeInUp 0.4s ease",
          }}
        >
          <h3
            style={{
              ...heading("0.95rem"),
              marginBottom: 14,
              color: "#2d6a4f",
            }}
          >
            {"\uD83D\uDCA1"} Food & Climate Facts
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 10,
            }}
          >
            {FUN_FACTS.map((fact, i) => (
              <div
                key={i}
                style={{
                  textAlign: "center",
                  padding: "14px 10px",
                  borderRadius: 12,
                  background: isDark ? "#1c2e22" : "#f0fdf4",
                  animation: `fadeInUp 0.4s ease ${i * 60}ms both`,
                }}
              >
                <div
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 800,
                    fontSize: "1.5rem",
                    color: "#2d6a4f",
                    marginBottom: 4,
                  }}
                >
                  {fact.stat}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: isDark ? "#7a9a7e" : "#555",
                    lineHeight: 1.4,
                  }}
                >
                  {fact.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tip Categories */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {TIPS.map((section, i) => {
            const isOpen = expandedCategory === i;
            return (
              <div
                key={i}
                style={{
                  background: isDark ? "#162419" : "#fff",
                  borderRadius: 14,
                  overflow: "hidden",
                  boxShadow: isDark
                    ? "0 2px 8px rgba(0,0,0,0.15)"
                    : "0 2px 8px rgba(27,67,50,0.06)",
                  animation: `fadeInUp 0.4s ease ${(i + 1) * 80}ms both`,
                }}
              >
                <button
                  onClick={() => setExpandedCategory(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  aria-label={`${isOpen ? "Collapse" : "Expand"} ${section.category} tips`}
                  style={{
                    width: "100%",
                    padding: "18px 20px",
                    border: "none",
                    background: isOpen ? section.bg : "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    transition: "all 0.2s ease",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: "1.5rem" }}>{section.icon}</span>
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        ...heading("1rem"),
                        color: section.color,
                      }}
                    >
                      {section.category}
                    </h3>
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: isDark ? "#7a9a7e" : "#888",
                        marginTop: 2,
                      }}
                    >
                      {section.tips.length} tips
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: "1.2rem",
                      color: "#888",
                      transition: "transform 0.2s",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0)",
                    }}
                  >
                    {"\u25BE"}
                  </span>
                </button>
                {isOpen && (
                  <div style={{ padding: "4px 20px 20px", animation: "fadeIn 0.3s ease" }}>
                    {section.tips.map((tip, j) => (
                      <div
                        key={j}
                        style={{
                          padding: "14px 0",
                          borderBottom:
                            j < section.tips.length - 1
                              ? "1px solid " + (isDark ? "#2d4a35" : "#f0f0f0")
                              : "none",
                        }}
                      >
                        <h4
                          style={{
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            marginBottom: 4,
                            color: isDark ? "#e8f5e9" : "#333",
                          }}
                        >
                          {tip.title}
                        </h4>
                        <p
                          style={{
                            fontSize: "0.85rem",
                            color: isDark ? "#b0c4b1" : "#666",
                            lineHeight: 1.6,
                          }}
                        >
                          {tip.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div
          style={{
            marginTop: 24,
            background: "linear-gradient(135deg, #2d6a4f, #40916c)",
            borderRadius: 14,
            padding: 28,
            textAlign: "center",
            animation: "fadeInUp 0.4s ease 0.4s both",
          }}
        >
          <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>{"\uD83C\uDF0D"}</div>
          <h3
            style={{
              color: "#fff",
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "1.1rem",
              marginBottom: 8,
            }}
          >
            Every Choice Counts
          </h3>
          <p
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: "0.88rem",
              lineHeight: 1.6,
              maxWidth: 400,
              margin: "0 auto",
            }}
          >
            Small changes in your food habits can have a big impact. Start by checking the
            GreenGrade score of your next purchase!
          </p>
        </div>
      </div>
    </div>
  );
}
