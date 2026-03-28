const nlcRootScope = typeof window !== "undefined" ? window : globalThis;

nlcRootScope.NLC_PRODUCT_CONFIG =
  nlcRootScope.NLC_PRODUCT_CONFIG ||
  (() => {
    const config = {
      productName: "Negative Lab Converter",
      version: "0.1.0",
      seller: {
        displayName: "h.g",
        legalName: "h.g",
        region: "Republic of Korea",
        supportEmail: "",
        supportResponseTime: "영업일 기준 2일 이내",
        websiteUrl: "",
      },
      commerce: {
        desktopPriceLabel: "$24",
        desktopPurchaseUrl: "",
        windowsDownloadUrl: "./release/Negative%20Lab%20Converter%20Setup%200.1.0.exe",
        macDownloadUrl: "./release/Negative%20Lab%20Converter-0.1.0-arm64.dmg",
        androidStoreUrl: "",
        iosStoreUrl: "",
      },
      docs: {
        privacyPolicyUrl: "./PRIVACY_POLICY.md",
        termsUrl: "./TERMS_OF_USE.md",
        refundPolicyUrl: "./REFUND_POLICY.md",
        noticesUrl: "./THIRD_PARTY_NOTICES.md",
        launchChecklistUrl: "./LAUNCH_CHECKLIST.md",
        storeCopyUrl: "./STORE_COPY_DRAFT.md",
      },
      release: {
        desktopDistributionNote: "Windows/macOS 웹직판",
        mobileDistributionNote: "Android/iOS 유료 스토어 앱",
        mobileReviewNote: "모바일 앱에는 외부 결제 링크를 넣지 않습니다.",
      },
      qa: {
        corpusMinimumFiles: 20,
        corpusManifestUrl: "./qa/corpus.manifest.json",
      },
    };

    const supportEmail = config.seller.supportEmail.trim();
    const supportSubject = encodeURIComponent(`${config.productName} Support`);

    config.links = {
      purchaseUrl: config.commerce.desktopPurchaseUrl || "",
      supportUrl: supportEmail ? `mailto:${supportEmail}?subject=${supportSubject}` : "",
      websiteUrl: config.seller.websiteUrl || "",
    };

    config.readiness = {
      hasSupportEmail: Boolean(supportEmail),
      hasDesktopPurchaseUrl: Boolean(config.commerce.desktopPurchaseUrl),
      hasWindowsDownloadUrl: Boolean(config.commerce.windowsDownloadUrl),
      hasMacDownloadUrl: Boolean(config.commerce.macDownloadUrl),
      hasAndroidStoreUrl: Boolean(config.commerce.androidStoreUrl),
      hasIosStoreUrl: Boolean(config.commerce.iosStoreUrl),
    };

    return config;
  })();
